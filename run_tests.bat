@echo off
chcp 65001 > nul
echo ========================================================
echo   Запуск автоматических тестов Gym Tracker TMA
echo ========================================================
echo.

cd backend
.\.venv\Scripts\pytest -v
pause
