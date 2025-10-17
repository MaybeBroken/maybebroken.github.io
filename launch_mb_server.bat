@echo off

python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python to run the server.
    pause
    exit /b 1
) else (
    echo Python is installed, starting the server...
)
cd /d %~dp0
python -m http.server 1200 -b localhost
pause