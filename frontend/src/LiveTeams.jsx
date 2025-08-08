import React, { useEffect, useRef, useState } from 'react';
import { useAutoVerticalScroll } from './hooks/useAutoVerticalScroll';

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

  const wrapRef = useRef(null);
  useAutoVerticalScroll(wrapRef, { speed: 25, pauseMs: 1500 });

  return (
    <div className="container" style={{ direction: 'rtl', textAlign: 'right' }}>
      <h2 style={{ marginTop: 0 }}>תוצאות לייב - שלשות</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div className="table-wrap" ref={wrapRef} style={{ maxHeight: '70vh' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>קפטן</th>
              <th>סה"כ גיל</th>
              <th>קטגוריה</th>
              <th>מסלולי בונוס (כולם TOP)</th>
              <th>ניקוד קבוצה</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, idx) => (
              <tr key={t.captainName}>
                <td>{idx + 1}</td>
                <td>{t.captainName}</td>
                <td>{Number.isFinite(Number(t.totalAge)) ? Number(t.totalAge).toFixed(1) : t.totalAge}</td>
                <td>{t.isOver100 ? '100+' : 'כללי'}</td>
                <td>{(t.bonusRoutes || []).join(', ') || '-'}</td>
                <td>{t.teamTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


