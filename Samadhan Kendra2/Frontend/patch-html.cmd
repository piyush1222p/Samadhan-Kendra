@echo off
REM One-click patch for Windows
cd /d "%~dp0"
echo Installing dependencies (first run only)...
call npm install --no-audit --no-fund
echo Patching HTML...
call npm run patch:html
echo.
echo Done. Backups saved as *.bak next to each HTML file.
pause