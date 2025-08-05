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

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3000',
  'https://digital-signature-app-dun.vercel.app',
  CLIENT_URL,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ dest: 'uploads/' });

// --- Upload Endpoint ---
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
    return res.json({ message: 'המייל נשלח בהצלחה!', id });
  } catch (err) {
    console.error('שגיאה בשליחת מייל:', err);
    return res.status(500).json({ message: 'שגיאה בשליחת מייל' });
  }
});

// --- Sign Endpoint ---
app.post('/sign', async (req, res) => {
  const { id, name } = req.body;

  if (!id || !name) {
    return res.status(400).json({ message: 'חסרים נתונים לחתימה' });
  }

  const uploadDir = path.join(__dirname, 'uploads');
  const originalPath = path.join(uploadDir, `${id}.pdf`);
  const signedPath = path.join(uploadDir, `${id}_signed.pdf`);

  // Check if file exists or find it by matching the ID
  let actualPath = originalPath;
  if (!fs.existsSync(originalPath)) {
    const files = fs.readdirSync(uploadDir);
    const match = files.find(f => f.startsWith(id) && f.endsWith('.pdf'));
    if (match) {
      actualPath = path.join(uploadDir, match);
    } else {
      return res.status(404).json({ message: 'קובץ לא נמצא' });
    }
  }

  try {
    const existingPdfBytes = fs.readFileSync(actualPath);
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
    fs.writeFileSync(signedPath, pdfBytes);

    return res.json({
      message: 'נחתם בהצלחה!',
      downloadUrl: `${SERVER_URL}/uploads/${id}_signed.pdf`,
    });
  } catch (err) {
    console.error('שגיאה במהלך החתימה:', err);
    return res.status(500).json({ message: 'שגיאה במהלך החתימה' });
  }
});

// --- Home Route ---
app.get('/', (req, res) => {
  res.send('השרת פועל! ברוך הבא :)');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
