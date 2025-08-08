import React, { useState } from 'react';

export default function PersonalResults() {
  const [idNumber, setIdNumber] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const fetchResults = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    const base = import.meta.env.VITE_API_BASE || 'https://color-festival.onrender.com';
    const id = idNumber.replace(/\D/g, '').padStart(9, '0');
    const res = await fetch(`${base}/personal-results/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (res.ok) setResults(data);
    else setError(data.error || 'שגיאה');
  };

  return (
    <div>
      <h2>תוצאות אישיות</h2>
      <form onSubmit={fetchResults}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="ת.ז (9 ספרות)"
          value={idNumber}
          onChange={e => setIdNumber(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button type="submit">הצג</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {results && (
        <div>
          <h3>ניקוד כולל: {results.total}</h3>
          <table border="1" cellPadding="4" style={{ width: '100%', marginTop: 10 }}>
            <thead>
              <tr>
                <th>מסלול</th>
                <th>תוצאה</th>
                <th>ניקוד</th>
              </tr>
            </thead>
            <tbody>
              {results.results.map(r => (
                <tr key={r.route}>
                  <td>{r.route}</td>
                  <td>{r.result === 'T' ? 'TOP' : r.result}</td>
                  <td>{r.score || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
