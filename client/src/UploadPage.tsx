import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CLIENT_BASE_URL = process.env.REACT_APP_CLIENT_BASE_URL || 'http://localhost:3000';

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
        `${API_URL}/upload`,
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
    <div style={{
      direction: 'rtl',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #fce4ec, #f8bbd0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Heebo, sans-serif',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '500px',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ textAlign: 'center', color: '#ad1457', marginBottom: '2rem' }}>
          העלאת קובץ לחתימה
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              בחר קובץ PDF:
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              כתובת מייל:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1.1rem',
              backgroundColor: '#ad1457',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s'
            }}
          >
            שלח
          </button>
        </form>

        {message && (
          <p style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            color: uploadedId ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {message}
          </p>
        )}

        {uploadedId && (
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            לעבור לחתימה:&nbsp;
            <a
              href={`${CLIENT_BASE_URL}/sign/${uploadedId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#ad1457', textDecoration: 'underline' }}
            >
              לחצי כאן
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
