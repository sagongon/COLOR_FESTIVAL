import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { google } from 'googleapis';
import fs from 'fs';

const app = express();
// CORS: אפשר לצמצם לפי משתנה סביבה ALLOWED_ORIGINS (מופרד בפסיקים), אחרת פתוח לכולם
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins }));
} else {
  app.use(cors());
}
const PORT = process.env.PORT || 4000;

app.use(express.json());

// --- Google Sheets connection setup ---
const GOOGLE_SA_PATH = process.env.GOOGLE_SA_PATH;
const GOOGLE_SA_JSON = process.env.GOOGLE_SA_JSON; // אופציה חלופית: התוכן המלא של ה-JSON במשתנה סביבה
const SPREADSHEET_ID_MAIN = process.env.SPREADSHEET_ID_MAIN;

if ((!GOOGLE_SA_PATH && !GOOGLE_SA_JSON) || !SPREADSHEET_ID_MAIN) {
  console.error('❌ Missing Google Sheets configuration in .env (need GOOGLE_SA_PATH or GOOGLE_SA_JSON, and SPREADSHEET_ID_MAIN)');
  process.exit(1);
}

let credentialsRaw;
try {
  if (GOOGLE_SA_JSON) {
    credentialsRaw = GOOGLE_SA_JSON;
  } else {
    credentialsRaw = fs.readFileSync(GOOGLE_SA_PATH, 'utf8');
  }
} catch (e) {
  console.error('❌ Failed to load Google Service Account credentials:', e.message);
  process.exit(1);
}
const credentials = JSON.parse(credentialsRaw);
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
const sheets = google.sheets({ version: 'v4', auth });

// Utility: get current timestamp in ISO string
function getNow() {
  return new Date().toISOString();
}

// Helpers for ID comparison
function digitsOnly(value) {
  return (value ?? '').toString().replace(/\D/g, '');
}
function padIdTo9(value) {
  const d = digitsOnly(value);
  return d.padStart(9, '0');
}

// Utility: get row index by identifier (UID, ID, or full name)
async function findRowIndex(identifier) {
  console.log('🔍 findRowIndex - מחפש:', identifier);
  
  // Read all rows from main sheet
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID_MAIN,
    range: 'פסטיבל הצבעים!A:ZZZ',
  });
  const rows = res.data.values || [];
  console.log('📊 מספר שורות שנקראו:', rows.length);
  
  // Find header columns
  const header = rows[0] || [];
  // התאמות רחבות יותר לכותרות
  const nameIdx = header.findIndex(h => /שם\s*מלא/i.test(h));
  const idIdx = header.findIndex(h => /(ת"ז|ת.ז|תז)/.test(h));
  const uidIdx = header.findIndex(h => (h || '').toString().toLowerCase().includes('uid'));
  
  console.log('📋 אינדקסים - שם:', nameIdx, 'ת"ז:', idIdx, 'UID:', uidIdx);
  
  // Find row by identifier
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const uidMatch = uidIdx !== -1 && row[uidIdx] && row[uidIdx].replace(/[:\s]/g, '') === identifier.replace(/[:\s]/g, '');
    const idMatch = idIdx !== -1 && row[idIdx] && padIdTo9(row[idIdx]) === padIdTo9(identifier);
    const nameMatch = nameIdx !== -1 && row[nameIdx] && (row[nameIdx] === identifier || row[nameIdx].toString().trim() === identifier.toString().trim());
    
    if (uidMatch || idMatch || nameMatch) {
      console.log('✅ נמצאה התאמה בשורה', i + 1, 'עם ערכים:', { uidMatch, idMatch, nameMatch });
      return { rowIndex: i + 1, row: rows[i], header };
    }
  }
  
  console.log('❌ לא נמצאה התאמה עבור:', identifier);
  return null;
}

// Utility: get column index for route (מסלול X)
function getRouteColIdx(header, routeNum) {
  const colIdx = header.findIndex(h => h.replace(/[^\d]/g, '') === String(routeNum));
  return colIdx;
}

// Utility: get column letter from index
function colIdxToLetter(idx) {
  let letter = '', n = idx + 1;
  while (n > 0) {
    let rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// --- Dynamic scoring from sheet "רשימות סגורות" ---
let scoreCache = { map: { Z1: 5, Z2: 10, T: 25, TOP: 25 }, loadedAt: 0 };

async function loadScoreMap() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID_MAIN,
      range: 'רשימות סגורות!A1:C100',
    });
    const rows = res.data.values || [];
    const map = {};
    let teamBonus = 10;
    const headerRow = rows[0] || [];
    for (const row of rows) {
      const key = (row[0] || '').toString().trim().toUpperCase();
      const valNum = Number((row[1] || '0').toString().trim());
      if (!key) continue;
      if (!Number.isNaN(valNum) && valNum >= 0) {
        if (key === 'TOP') {
          map['TOP'] = valNum;
          map['T'] = valNum;
        } else {
          map[key] = valNum;
        }
      }
    }
    // locate bonus column by header containing "בונוס"
    const bonusColIdx = headerRow.findIndex(h => (h || '').toString().includes('בונוס'));
    if (bonusColIdx !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const cell = rows[i][bonusColIdx];
        const maybeNum = Number((cell || '').toString().trim());
        if (!Number.isNaN(maybeNum)) {
          teamBonus = maybeNum;
          break;
        }
      }
    }
    if (map['Z1'] == null) map['Z1'] = 5;
    if (map['Z2'] == null) map['Z2'] = 10;
    if (map['T'] == null) map['T'] = map['TOP'] != null ? map['TOP'] : 25;
    if (map['TOP'] == null) map['TOP'] = map['T'];
    scoreCache = { map, teamBonus, loadedAt: Date.now() };
    console.log('✅ Score map loaded:', scoreCache.map, 'teamBonus:', teamBonus);
  } catch (err) {
    console.warn('⚠️ לא ניתן לטעון ניקוד מ"רשימות סגורות". שימוש בברירת מחדל.', err.message);
    scoreCache = { map: { Z1: 5, Z2: 10, T: 25, TOP: 25 }, teamBonus: 10, loadedAt: Date.now() };
  }
}

async function ensureScoreMapFresh() {
  const TTL_MS = 5 * 60 * 1000; // 5 דקות
  if (!scoreCache.loadedAt || Date.now() - scoreCache.loadedAt > TTL_MS) {
    await loadScoreMap();
  }
}

function getScoreFor(value) {
  const key = (value || '').toString().trim().toUpperCase();
  return scoreCache.map[key] || 0;
}

function isUpgrade(newVal, prevVal) {
  return getScoreFor(newVal) > getScoreFor(prevVal);
}

// ודא קיום טאב LOG בגיליון הראשי
async function ensureLogSheet() {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID_MAIN });
  const sheetNames = sheetMeta.data.sheets.map((s) => s.properties.title);
  if (!sheetNames.includes('LOG')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID_MAIN,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'LOG' } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID_MAIN,
      range: 'LOG!A1:F1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['שם מלא', 'UID', 'ת"ז', 'מסלול', 'תוצאה', 'שעה']] },
    });
    console.log('🆕 נוצר טאב LOG בגיליון הראשי');
  }
}

// POST /submit-result
app.post('/submit-result', async (req, res) => {
  try {
    const { identifier, route, result } = req.body;
    if (!identifier || !route || !result) {
      return res.status(400).json({ error: 'Missing identifier, route or result' });
    }
    // 1. Find user row
    const found = await findRowIndex(identifier);
    if (!found) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }
    const { rowIndex, row, header } = found;
    // 2. Find route column
    const colIdx = getRouteColIdx(header, route);
    if (colIdx === -1) {
      return res.status(400).json({ error: 'מסלול לא נמצא' });
    }
    const colLetter = colIdxToLetter(colIdx);
    const cellRef = `${colLetter}${rowIndex}`;
    const prevVal = row[colIdx] || '';
    await ensureScoreMapFresh();
    // 3. Update only if result is higher
    if (isUpgrade(result, prevVal)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID_MAIN,
        range: `פסטיבל הצבעים!${cellRef}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[result]] },
      });
    }
    // 4. Always log to LOG sheet
    const now = new Date().toLocaleString('he-IL');
    await ensureLogSheet();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID_MAIN,
      range: 'LOG!A:F',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          row[header.findIndex(h => h.includes('שם מלא'))] || '',
          row[header.findIndex(h => h.toLowerCase().includes('uid'))] || '',
          row[header.findIndex(h => h.includes('ת"ז'))] || '',
          route,
          result,
          now
        ]],
      },
    });
    res.json({ message: 'OK', updated: isUpgrade(result, prevVal) });
  } catch (err) {
    console.error('❌ שגיאה ב-/submit-result:', err.message);
    res.status(500).json({ error: 'שגיאה בשרת' });
  }
});

// GET /personal-results/:identifier
app.get('/personal-results/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('🔍 מחפש משתמש:', identifier);
    
    const found = await findRowIndex(identifier);
    if (!found) {
      console.log('❌ משתמש לא נמצא:', identifier);
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }
    
    const { row, header } = found;
    console.log('✅ נמצא משתמש:', row[header.findIndex(h => h.includes('שם מלא'))]);
    console.log('📋 כותרות:', header);
    console.log('📊 שורה:', row);
    
    // מצא את עמודות המסלולים
    const results = [];
    let total = 0;
    await ensureScoreMapFresh();
    for (let i = 0; i < header.length; i++) {
      if (/מסלול\s*\d+/.test(header[i])) {
        const routeNum = header[i].replace(/[^\d]/g, '');
        const val = (row[i] || '').toUpperCase();
        const score = getScoreFor(val);
        console.log(`מסלול ${routeNum}: ערך="${val}", ניקוד=${score}`);
        if (score > 0) total += score;
        results.push({ route: Number(routeNum), result: val, score });
      }
    }
    
    console.log('📈 תוצאות:', results);
    console.log('🏆 סה"כ:', total);
    
    res.json({ identifier, results, total });
  } catch (err) {
    console.error('❌ שגיאה ב-/personal-results:', err.message);
    res.status(500).json({ error: 'שגיאה בשרת' });
  }
});

// Utility: מציאת כל חברי השלשה לפי שם קפטן
async function findTeamMembers(captainName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID_MAIN,
    range: 'פסטיבל הצבעים!A:ZZZ',
  });
  const rows = res.data.values || [];
  const header = rows[0] || [];
  const captainIdx = header.findIndex(h => h.includes('שם הקפטן'));
  const nameIdx = header.findIndex(h => h.includes('שם מלא'));
  const ageIdx = header.findIndex(h => h.includes('גיל'));
  if (captainIdx === -1 || nameIdx === -1) return null;
  const members = rows.slice(1).filter(row => row[captainIdx] === captainName).map(row => ({
    name: row[nameIdx],
    age: parseFloat(row[ageIdx]) || 0,
    results: []
  }));
  return members;
}

// GET /team-results/:captainName
app.get('/team-results/:captainName', async (req, res) => {
  try {
    const { captainName } = req.params;
    const members = await findTeamMembers(captainName);
    if (!members || members.length === 0) {
      return res.status(404).json({ error: 'שלשה לא נמצאה' });
    }
    // חישוב סכום גילאים
    const totalAge = members.reduce((sum, m) => sum + m.age, 0);
    const isOver100 = totalAge > 100;
    // שליפת תוצאות לכל חבר
    await ensureScoreMapFresh();
    for (const member of members) {
      const found = await findRowIndex(member.name);
      if (!found) continue;
      const { row, header } = found;
      for (let i = 0; i < header.length; i++) {
        if (/מסלול\s*\d+/.test(header[i])) {
          const routeNum = parseInt(header[i].replace(/[^\d]/g, ''));
          const result = (row[i] || '').toUpperCase();
          const score = getScoreFor(result);
          member.results.push({ route: routeNum, result, score });
        }
      }
    }
    // חישוב בונוסים למסלולים שבהם כולם השיגו TOP
    const bonusRoutes = [];
    const maxRoute = Math.max(...members[0].results.map(r => r.route));
    for (let route = 1; route <= maxRoute; route++) {
      const allTop = members.every(m =>
        m.results.find(r => r.route === route)?.result === 'T'
      );
      if (allTop) bonusRoutes.push(route);
    }
    // חישוב סכומים
    const memberTotals = members.map(m => ({
      name: m.name,
      total: m.results.reduce((sum, r) => sum + r.score, 0)
    }));
    const teamTotal = memberTotals.reduce((sum, m) => sum + m.total, 0) +
      (bonusRoutes.length * (scoreCache.teamBonus ?? 10));
    res.json({
      captainName,
      members,
      isOver100,
      totalAge,
      bonusRoutes,
      memberTotals,
      teamTotal
    });
  } catch (err) {
    console.error('❌ שגיאה ב-/team-results:', err.message);
    res.status(500).json({ error: 'שגיאה בשרת' });
  }
});

// מזהה שם לפי מספר ת"ז
app.get('/resolve-id/:id', async (req, res) => {
  try {
    const id = (req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'חסר ת"ז' });
    const found = await findRowIndex(id);
    if (!found) return res.status(404).json({ error: 'לא נמצא' });
    const { row, header } = found;
    const nameIdx = header.findIndex(h => h.includes('שם מלא'));
    const name = nameIdx !== -1 ? (row[nameIdx] || '') : '';
    return res.json({ name });
  } catch (err) {
    console.error('❌ שגיאה ב-/resolve-id:', err.message);
    return res.status(500).json({ error: 'שגיאה בשרת' });
  }
});

// --- כאן יתווספו ה-API ---

app.get('/', (req, res) => {
  res.send('🟢 Climbing Competition API is running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
