@echo off
title Smart Study Planner - Frontend UI
cd /d "%~dp0frontend"
echo Installing frontend dependencies if needed...
call npm install
echo Starting Frontend UI on http://localhost:5173 ...
call npm run dev
pause
