import React, { useEffect, useRef, useState } from 'react';
import { useAutoVerticalScroll } from './hooks/useAutoVerticalScroll';

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

  const wrapRef = useRef(null);
  useAutoVerticalScroll(wrapRef, { speed: 25, pauseMs: 1500 });

  return (
    <div className="container" style={{ direction: 'rtl', textAlign: 'right' }}>
      <h2 style={{ marginTop: 0 }}>תוצאות לייב - יחידים</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div className="table-wrap" ref={wrapRef} style={{ maxHeight: '70vh' }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>שם</th>
              <th>ניקוד</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id + r.name}>
                <td>{idx + 1}</td>
                <td>{r.name || r.id}</td>
                <td>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


