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
      const res = await axios.post<SignResponse>(`${process.env.REACT_APP_API_URL}/sign`, {
        id,
        name: signature,
      });

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
    <div style={{ direction: 'rtl', padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>חתימה על המסמך</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="signature">נא להזין את שמך המלא:</label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          required
          placeholder="לדוגמה: גילי כהן"
          style={{
            width: '100%',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            padding: '0.5rem',
            fontSize: '1rem',
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'שולח...' : 'שלח חתימה'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem', color: signedUrl ? 'green' : 'red' }}>{message}</p>}

      {signedUrl && (
        <p>
          המסמך החתום זמין להורדה:&nbsp;
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            הורד כאן
          </a>
        </p>
      )}
    </div>
  );
};

export default SignPage;
