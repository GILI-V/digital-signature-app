import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface SignResponse {
  message: string;
  downloadUrl?: string;
}

const SignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [signedUrl, setSignedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !signature.trim()) {
      setMessage('חובה להזין חתימה תקינה');
      return;
    }

    setLoading(true);
    setMessage('');
    setSignedUrl('');

    try {
      const res = await axios.post<SignResponse>(
        `${process.env.REACT_APP_API_URL}/sign`,
        {
          id,
          name: signature,
        }
      );

      setMessage(res.data.message);
      if (res.data.downloadUrl) {
        setSignedUrl(res.data.downloadUrl);
      }
    } catch (err) {
      console.error('שגיאה בבקשת החתימה:', err);
      setMessage('אירעה שגיאה בשליחת החתימה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      direction: 'rtl',
      padding: '2rem',
      maxWidth: '500px',
      margin: '4rem auto',
      fontFamily: 'Arial, sans-serif',
      border: '1px solid #ddd',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      backgroundColor: '#fafafa',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>חתימה על המסמך</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="signature" style={{ display: 'block', marginBottom: '0.5rem' }}>
          נא להזין את שמך המלא:
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          required
          placeholder="לדוגמה: גילי כהן"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
          }}
        >
          {loading ? 'שולח...' : 'שלח חתימה'}
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: '1.5rem',
          color: signedUrl ? 'green' : 'red',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          {message}
        </p>
      )}

      {signedUrl && (
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          המסמך החתום זמין להורדה:&nbsp;
          <a href={signedUrl} target="_blank" rel="noopener noreferrer" style={{
            color: '#007bff',
            textDecoration: 'underline',
          }}>
            הורד כאן
          </a>
        </p>
      )}
    </div>
  );
};

export default SignPage;
