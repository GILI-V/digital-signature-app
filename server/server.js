require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: 'uploads/' });

// שלב א: העלאת קובץ ושליחת קישור במייל
app.post('/upload', upload.single('file'), async (req, res) => {
  const email = req.body.email;
  const file = req.file;

  if (!file || !email) {
    return res.status(400).json({ message: 'חובה לצרף קובץ ומייל' });
  }

  const id = uuidv4();
  const ext = path.extname(file.originalname);
  const newPath = path.join(__dirname, 'uploads', `${id}${ext}`);
  fs.renameSync(file.path, newPath);

  const metadata = {
    id,
    originalName: file.originalname,
    email,
    filePath: newPath,
    fileExtension: ext,
  };
  fs.mkdirSync('./metadata', { recursive: true });
  fs.writeFileSync(`./metadata/${id}.json`, JSON.stringify(metadata));

  const link = `${CLIENT_URL}/sign/${id}`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"חתימה דיגיטלית" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'חתום על המסמך שלך',
      html: `<p>שלום,</p><p>לחתימה על המסמך שלך:</p><a href="${link}">${link}</a>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("המייל עם הקובץ נשלח בהצלחה ל:", email);

    return res.json({ message: 'המייל נשלח בהצלחה!', id });
  } catch (err) {
    console.error('שגיאה בשליחת מייל:', err);
    return res.status(500).json({ message: 'שגיאה בשליחת מייל' });
  }
});

// שלב ב: חתימה על המסמך ושליחה חוזרת במייל
app.post('/sign', async (req, res) => {
  console.log('קריאה ל- /sign התקבלה עם:', req.body);

  const { id, name } = req.body;

  if (!id || !name) {
    return res.status(400).json({ message: 'חסרים נתונים לחתימה' });
  }

  const metadataPath = path.join(__dirname, 'metadata', `${id}.json`);
  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ message: 'Metadata not found for this ID' });
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const originalFilePath = metadata.filePath;
  const email = metadata.email;

  if (!fs.existsSync(originalFilePath)) {
    return res.status(404).json({ message: 'קובץ לא נמצא' });
  }

  const signedFilePath = path.join(path.dirname(originalFilePath), `${id}_signed${metadata.fileExtension}`);

  try {
    const existingPdfBytes = fs.readFileSync(originalFilePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.resolve(__dirname, 'david.ttf');
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file not found at ${fontPath}`);
    }

    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    lastPage.drawText(`חתימה: ${name}`, {
      x: 50,
      y: 50,
      size: 18,
      font: customFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(signedFilePath, pdfBytes);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"חתימה דיגיטלית" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'המסמך החתום שלך',
      text: 'שלום, מצורף המסמך שחתמת עליו.',
      attachments: [
        {
          filename: `signed_${metadata.originalName}`,
          path: signedFilePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      message: 'נחתם ונשלח במייל בהצלחה!',
      downloadUrl: `${SERVER_URL}/uploads/${path.basename(signedFilePath)}`,
    });
  } catch (err) {
    console.error('שגיאה במהלך החתימה:', err);
    return res.status(500).json({ message: 'שגיאה במהלך החתימה' });
  }
});

app.listen(PORT, () => {
  console.log(`שרת פעיל על פורט ${PORT}`);
});