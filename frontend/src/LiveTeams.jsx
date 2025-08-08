import React, { useEffect, useState } from 'react';

export default function LiveTeams() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const base = import.meta.env.VITE_API_BASE || 'https://color-festival.onrender.com';
      const res = await fetch(`${base}/live/teams`);
      if (!res.ok) throw new Error('שגיאה בטעינה');
      const data = await res.json();
      setRows(data);
    } catch (e) {
      setError(e.message || 'שגיאה');
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ direction: 'rtl', textAlign: 'right' }}>
      <h2 style={{ marginTop: 0 }}>תוצאות לייב - שלשות</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>#</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>קפטן</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>סה"כ גיל</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>קטגוריה</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>מסלולי בונוס (כולם TOP)</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>ניקוד קבוצה</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, idx) => (
              <tr key={t.captainName}>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{idx + 1}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{t.captainName}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{t.totalAge}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{t.isOver100 ? '100+' : 'כללי'}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{(t.bonusRoutes || []).join(', ') || '-'}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{t.teamTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


