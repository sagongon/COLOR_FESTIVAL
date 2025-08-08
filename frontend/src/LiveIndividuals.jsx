import React, { useEffect, useState } from 'react';

export default function LiveIndividuals() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const base = import.meta.env.VITE_API_BASE || 'https://color-festival.onrender.com';
      const res = await fetch(`${base}/live/individuals`);
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
      <h2 style={{ marginTop: 0 }}>תוצאות לייב - יחידים</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>#</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>שם</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd' }}>ניקוד</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id + r.name}>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{idx + 1}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{r.name || r.id}</td>
                <td style={{ borderBottom: '1px solid #f0f0f0' }}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


