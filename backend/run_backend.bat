@echo off
title Smart Study Planner + AI Tutor (Unified Server)
cd /d "%~dp0"
echo ========================================================
echo   Smart Study Planner + AI Tutor - Launching Server
echo ========================================================
echo.

set "PY_EXE="
if exist "%~dp0venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0venv\Scripts\python.exe"
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_EXE=python"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" (
        set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else (
        echo ERROR: Python not found! Please ensure Python or backend\venv is installed.
        pause
        exit /b 1
    )
)

echo Starting unified server on http://localhost:8000 ...
echo You can open your browser at: http://localhost:8000
echo (Press Ctrl+C to stop the server)
echo.

"%PY_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
