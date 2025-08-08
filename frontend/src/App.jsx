import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import SubmitResult from './SubmitResult';
import PersonalResults from './PersonalResults';
import TeamResults from './TeamResults';
import LiveIndividuals from './LiveIndividuals';
import LiveTeams from './LiveTeams';

export default function App() {
  useEffect(() => {
    document.title = 'COLOR FESTIVAL';
  }, []);
  const location = useLocation();
  const isLive = location.pathname.startsWith('/live');
  return (
    <div style={{ direction: 'rtl', textAlign: 'right', padding: 20 }}>
      {!isLive && (
        <nav style={{ marginBottom: 20 }}>
          <Link to="/" style={{ marginLeft: 10 }}>הזנת תוצאה</Link>
          <Link to="/personal" style={{ marginLeft: 10 }}>תוצאות אישיות</Link>
          <Link to="/team" style={{ marginLeft: 10 }}>תוצאות שלשה</Link>
        </nav>
      )}
      <Routes>
        <Route path="/" element={<SubmitResult />} />
        <Route path="/personal" element={<PersonalResults />} />
        <Route path="/team" element={<TeamResults />} />
        <Route path="/live/individuals" element={<LiveIndividuals />} />
        <Route path="/live/teams" element={<LiveTeams />} />
      </Routes>
    </div>
  );
}
