@echo off
REM Starts ProjectPilot in Docker Desktop (Windows). Double-click this file.
cd /d "%~dp0"
title ProjectPilot - Docker

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop is not running.
  echo Start Docker Desktop, wait until it says "Engine running", then run this file again.
  pause
  exit /b 1
)

echo Building and starting ProjectPilot (the first time takes a few minutes)...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Something went wrong. See the messages above.
  pause
  exit /b 1
)

echo Waiting for the app to be ready...
set /a tries=0
:wait
set /a tries+=1
curl -s -o nul -f http://localhost:8080/api/health && goto ready
if %tries% GEQ 60 goto slow
timeout /t 5 /nobreak >nul
goto wait

:slow
echo The app is taking longer than expected. Check the logs with: docker compose logs api
pause
exit /b 1

:ready
echo.
echo ProjectPilot is running: http://localhost:8080
echo Sign in with aarav.patel@example.com / Password@123
start "" http://localhost:8080
pause
