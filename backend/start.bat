@echo off
echo ============================================================
echo  Appointment System -- Backend Server
echo ============================================================
echo.

cd /d "%~dp0"

REM ?? Activate venv
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found.
    echo Please run:  python -m venv venv
    echo Then run:    venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

REM ?? Copy .env.example to .env if .env is missing
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env not found -- copying from .env.example
        copy ".env.example" ".env"
        echo [ACTION] Please edit backend\.env with your MySQL credentials, then re-run this script.
        pause
        exit /b 0
    )
)

echo [INFO] Starting Flask server on http://localhost:5000 ...
echo [INFO] Press Ctrl+C to stop.
echo.
python app.py
pause
