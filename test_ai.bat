@echo off
title Test Gemini AI Connection
cd /d "%~dp0backend"
venv\Scripts\python.exe test_key.py
pause
