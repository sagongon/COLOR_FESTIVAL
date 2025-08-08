import React, { useState } from 'react';

export default function TeamResults() {
  const [captain, setCaptain] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const fetchResults = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    const res = await fetch(`http://localhost:4000/team-results/${encodeURIComponent(captain)}`);
    const data = await res.json();
    if (res.ok) setResults(data);
    else setError(data.error || 'שגיאה');
  };

  return (
    <div>
      <h2>תוצאות שלשה</h2>
      <form onSubmit={fetchResults}>
        <input
          type="text"
          placeholder="שם קפטן"
          value={captain}
          onChange={e => setCaptain(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button type="submit">הצג</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {results && (
        <div>
          <h3>ניקוד כולל לשלשה: {results.teamTotal}</h3>
          <div>בונוס (10 נק') במסלולים: {results.bonusRoutes.join(', ') || 'אין'}</div>
          <div>סכום גילאים: {results.totalAge} ({results.isOver100 ? '100+' : 'רגיל'})</div>
          <table border="1" cellPadding="4" style={{ width: '100%', marginTop: 10 }}>
            <thead>
              <tr>
                <th>שם</th>
                <th>ניקוד אישי</th>
              </tr>
            </thead>
            <tbody>
              {results.memberTotals.map(m => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

