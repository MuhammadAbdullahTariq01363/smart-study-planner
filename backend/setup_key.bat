@echo off
cd /d "%~dp0"
echo ============================================================
echo   Smart Study Planner - AI key setup
echo ============================================================
echo.
echo 1. Open  https://aistudio.google.com/apikey  and sign in with Google.
echo 2. Click "Create API key" and copy the key.
echo 3. Paste it below (right-click in this window to paste) and press Enter.
echo.
set /p KEY=Paste your Gemini API key here: 
set "KEY=%KEY: =%"
if "%KEY%"=="" (
  echo.
  echo No key entered. Nothing was changed.
  pause
  exit /b 1
)
> .env echo LLM_PROVIDER=gemini
>> .env echo GEMINI_API_KEY=%KEY%
echo.
echo Done! The key was saved in:  %CD%\.env
echo (Never upload the .env file to GitHub. It is already in .gitignore.)
echo.
echo Now restart the server (Ctrl+C in the server window, then start it again).
echo In the app, open "AI Tutor Chat" - the badge should say "Gemini AI connected".
echo.
pause
