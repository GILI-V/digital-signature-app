import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !email) {
      setMessage('נא לבחור קובץ ולהזין כתובת מייל');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const response = await axios.post<{ message: string; id: string }>(
        'http://localhost:5000/upload',
        formData
      );
      setMessage(response.data.message || 'הקובץ נשלח בהצלחה!');
      setUploadedId(response.data.id || null);
      setFile(null);
      setEmail('');
    } catch (error) {
      setMessage('אירעה שגיאה בשליחה');
    }
  };

  return (
    <div className="upload-page" style={{ direction: 'rtl', padding: '2rem' }}>
      <h2>העלאת קובץ</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>בחר קובץ PDF:</label>
          <input type="file" onChange={handleFileChange} accept=".pdf" />
        </div>
        <div>
          <label>כתובת מייל:</label>
          <input
            type="email"
            value={email}
            placeholder="example@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit">שלח</button>
      </form>
      {message && <p>{message}</p>}
      {uploadedId && (
        <p>
          לעבור לחתימה:{" "}
          <a href={`http://localhost:3000/sign/${uploadedId}`} target="_blank" rel="noopener noreferrer">
            לחצי כאן
          </a>
        </p>
      )}
    </div>
  );
}

export default UploadPage;
