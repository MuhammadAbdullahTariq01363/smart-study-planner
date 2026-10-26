@echo off
title Launch Smart Study Planner
cd /d "%~dp0"

echo ========================================================
echo   Launching Smart Study Planner + AI Tutor
echo ========================================================
echo.
echo 1. Starting Backend API Server (http://localhost:8000)...
start "Smart Study Planner Server" cmd /c "cd /d "%~dp0backend" && run_backend.bat"

echo 2. Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo 3. Opening Application in your browser...
start http://localhost:8000

echo.
echo Application started! Keep the server window open while using the app.
echo.
pause
