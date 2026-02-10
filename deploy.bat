@echo off
echo ==========================================
echo   AppSport Admin Dashboard - Deploy
echo ==========================================
echo.

REM Check for .env.local
if not exist .env.local (
    echo WARNING: No .env.local found. Creating from .env.example...
    copy .env.example .env.local
    echo.
    echo Please edit .env.local with your production API URL:
    echo   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
    echo.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm ci --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Copying static assets to standalone...
xcopy /E /I /Y public .next\standalone\public >nul 2>&1
xcopy /E /I /Y .next\static .next\standalone\.next\static >nul 2>&1

echo.
echo ==========================================
echo   Build complete!
echo ==========================================
echo.
echo To start the server:
echo   set PORT=3001 ^& set HOSTNAME=0.0.0.0 ^& node .next\standalone\server.js
echo.
echo Or with PM2:
echo   pm2 start ecosystem.config.js
echo.
pause
