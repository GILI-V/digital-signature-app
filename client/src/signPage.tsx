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
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #e3f2fd, #bbdefb)',
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
        <h2 style={{ textAlign: 'center', color: '#1565c0', marginBottom: '1.5rem' }}>
          חתימה על מסמך
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="signature" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
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
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginBottom: '1.5rem'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1.1rem',
              backgroundColor: loading ? '#b0bec5' : '#1565c0',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: '0.3s'
            }}
          >
            {loading ? 'שולח...' : 'שלח חתימה'}
          </button>
        </form>

        {message && (
          <p style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            color: signedUrl ? 'green' : 'red',
            fontWeight: 'bold'
          }}>
            {message}
          </p>
        )}

        {signedUrl && (
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            המסמך החתום זמין להורדה:&nbsp;
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1565c0', textDecoration: 'underline' }}
            >
              הורד כאן
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignPage;
