# COLOR FESTIVAL

הוראות הפעלה ודיפלוי (Backend + Frontend)

## מקומית
1. backend
   - צור `backend/.env` לפי המשתנים:
     - `PORT=4000`
     - `GOOGLE_SA_PATH=../CLJS-secrets/google-sa.json`
     - `SPREADSHEET_ID_MAIN=...` (מה-URL של הגיליון)
     - אופציונלי: `ALLOWED_ORIGINS=` (דומיינים מופרדים בפסיקים)
   - התקנה והרצה:
     ```
     cd backend
     npm install
     npm start
     ```
2. frontend
   - צור `frontend/.env.local` עם:
     ```
     VITE_API_BASE=http://localhost:4000
     ```
   - התקנה והרצה:
     ```
     cd frontend
     npm install
     npm run dev
     ```

## דיפלוי

### Render (Backend)
- New → Web Service → חברו ל-Repo ובחרו תיקיית `backend/`.
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment:
  - `SPREADSHEET_ID_MAIN`
  - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
  - Secret File: `google-sa.json` עם תוכן ה-Service Account
  - `GOOGLE_SA_PATH=/etc/secrets/google-sa.json`

שימו לב: שתפו את הגיליון עם האימייל של ה-Service Account כ-Editor.

### Vercel (Frontend)
- New Project → Import מה-Repo → בחרו `frontend/`.
- Build Command: `npm run build`
- Output: `dist`
- Environment Variables:
  - `VITE_API_BASE=https://<your-render-service>.onrender.com`

לאחר הדיפלוי: בדקו שהקריאות הולכות ל-API של Render והכל עובד (Z1/Z2/T, בונוס שלשות).

# פסטיבל הצבעים – Frontend (React)

מערכת ניהול תחרות טיפוס – הזנת תוצאות, תצוגה אישית ושלשות.

## התקנה

1. יצירת פרויקט (אם עוד לא קיים):
   ```bash
   npm create vite@latest color-festival-frontend -- --template react
   cd color-festival-frontend
   npm install
   npm install react-router-dom
   ```

2. העתק את הקבצים:
   - App.jsx
   - SubmitResult.jsx
   - PersonalResults.jsx
   - TeamResults.jsx

3. ודא שה-Backend (Node.js) רץ על `http://localhost:4000`.

## הפעלה

```bash
npm run dev
```

## דפים עיקריים

- **הזנת תוצאה** – הזדהות, בחירת מסלול ותוצאה, שליחה ל-API.
- **תוצאות אישיות** – הצגת כל התוצאות והניקוד של משתתף.
- **תוצאות שלשה** – הצגת ניקוד של כל חברי שלשה, בונוסים, וסכום כולל.

## קישור ל-API

- כתובת ברירת מחדל: `http://localhost:4000`
- ניתן לשנות בקוד ה-Frontend במידת הצורך.

## עיצוב

- עיצוב בסיסי, RTL (ימין לשמאל), ניתן להרחבה.

---

בהצלחה!


