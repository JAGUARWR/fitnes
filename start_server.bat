@echo off
chcp 65001 > nul
echo ========================================================
echo   Запуск Gym Tracker TMA (Сервер + WebApp + Telegram Bot)
echo ========================================================
echo.

cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
