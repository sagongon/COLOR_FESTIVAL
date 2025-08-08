import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SubmitResult from './SubmitResult';
import PersonalResults from './PersonalResults';
import TeamResults from './TeamResults';

export default function App() {
  useEffect(() => {
    document.title = 'COLOR FESTIVAL';
  }, []);
  return (
    <BrowserRouter>
      <div style={{ direction: 'rtl', textAlign: 'right', padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginLeft: 10 }}>הזנת תוצאה</Link>
          <Link to="/personal" style={{ marginLeft: 10 }}>תוצאות אישיות</Link>
          <Link to="/team" style={{ marginLeft: 10 }}>תוצאות שלשה</Link>
        </nav>
        <Routes>
          <Route path="/" element={<SubmitResult />} />
          <Route path="/personal" element={<PersonalResults />} />
          <Route path="/team" element={<TeamResults />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
