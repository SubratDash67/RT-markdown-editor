@echo off
echo 🚀 Setting up RT Markdown Editor project structure...

REM Create main project directories
mkdir frontend\src\components\editor 2>nul
mkdir frontend\src\components\preview 2>nul
mkdir frontend\src\components\ui 2>nul
mkdir frontend\src\components\auth 2>nul
mkdir frontend\src\components\collaboration 2>nul
mkdir frontend\src\hooks 2>nul
mkdir frontend\src\utils 2>nul
mkdir frontend\src\styles 2>nul
mkdir frontend\src\contexts 2>nul
mkdir frontend\public 2>nul
mkdir backend\src\routes 2>nul
mkdir backend\src\middleware 2>nul
mkdir backend\src\controllers 2>nul
mkdir backend\src\utils 2>nul
mkdir backend\src\websocket 2>nul
mkdir docs 2>nul
mkdir scripts 2>nul

echo ✅ Directory structure created!

REM Create frontend package.json
(
echo {
echo   "name": "rt-markdown-editor-frontend",
echo   "version": "0.1.0",
echo   "private": true,
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "react-scripts": "5.0.1",
echo     "@codemirror/state": "^6.2.1",
echo     "@codemirror/view": "^6.21.3",
echo     "@codemirror/lang-markdown": "^6.2.1",
echo     "markdown-it": "^13.0.1",
echo     "yjs": "^13.6.7",
echo     "y-websocket": "^1.5.0",
echo     "@supabase/supabase-js": "^2.38.0",
echo     "tailwindcss": "^3.3.3"
echo   },
echo   "scripts": {
echo     "start": "react-scripts start",
echo     "build": "react-scripts build",
echo     "test": "react-scripts test",
echo     "eject": "react-scripts eject"
echo   },
echo   "browserslist": {
echo     "production": [
echo       "^>0.2%%",
echo       "not dead",
echo       "not op_mini all"
echo     ],
echo     "development": [
echo       "last 1 chrome version",
echo       "last 1 firefox version",
echo       "last 1 safari version"
echo     ]
echo   }
echo }
) > frontend\package.json

echo ✅ Frontend package.json created!

REM Create backend package.json
(
echo {
echo   "name": "rt-markdown-editor-backend",
echo   "version": "1.0.0",
echo   "description": "Backend for Real-time Collaborative Markdown Editor",
echo   "main": "src/server.js",
echo   "scripts": {
echo     "start": "node src/server.js",
echo     "dev": "nodemon src/server.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "cors": "^2.8.5",
echo     "dotenv": "^16.3.1",
echo     "ws": "^8.14.2",
echo     "y-websocket": "^1.5.0",
echo     "@supabase/supabase-js": "^2.38.0"
echo   },
echo   "devDependencies": {
echo     "nodemon": "^3.0.1"
echo   }
echo }
) > backend\package.json

echo ✅ Backend package.json created!

echo ✅ Project structure setup complete!
echo.
echo 📁 Next steps:
echo 1. Run: git init
echo 2. Run: git add .
echo 3. Run: git commit -m "Initial project setup"
echo 4. Connect to GitHub repository
echo 5. Set up Supabase, Render, and Netlify

pause