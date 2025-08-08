import React, { useEffect, useState } from 'react';

export default function SubmitResult() {
  const [idNumber, setIdNumber] = useState('');
  const [athleteName, setAthleteName] = useState('');
  const [route, setRoute] = useState('');
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const id = idNumber.trim();
      setAthleteName('');
      // בצע Resolve רק כשהת.ז באורך 8 ספרות ומעלה (יש ת"ז עם 8)
      if (!id || id.length < 8) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/resolve-id/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setAthleteName(data.name || '');
      } catch {}
    };
    run();
    return () => controller.abort();
  }, [idNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const resultToSend = result === 'TOP' ? 'T' : result;
    const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/submit-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: idNumber.trim(), route: Number(route), result: resultToSend })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.updated ? 'הנתון עודכן בהצלחה!' : 'הנתון נשמר (לא שודרג)');
    } else {
      setMessage(data.error || 'שגיאה בשליחה');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="container">
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>הזנת תוצאה</h2>
      <label>ת.ז</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="הכנס/י ת.ז"
          value={idNumber}
          onChange={e => setIdNumber(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <input
          type="text"
          placeholder="שם הספורטאי"
          value={athleteName}
          readOnly
          style={{ flex: 1, background: '#f6f6f6' }}
        />
      </div>

      <label>מספר מסלול</label>
      <input
        type="number"
        placeholder="מספר מסלול (1-40)"
        value={route}
        onChange={e => setRoute(e.target.value)}
        required
        min={1}
        max={40}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <label>תוצאה</label>
      <select
        value={result}
        onChange={e => setResult(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 8 }}
      >
        <option value="" disabled hidden>בחר תוצאה</option>
        <option value="Z1">Z1</option>
        <option value="Z2">Z2</option>
        <option value="TOP">TOP</option>
      </select>
      <button type="submit" style={{ width: '100%' }}>שלח</button>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </form>
  );
}
