@echo off
:: Quick Hackathon Deployment Script for Windows Server
:: Run this on your Windows server

echo ================================
echo MyDuit Hackathon Quick Deploy
echo ================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found! Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js %NODE_VERSION% installed
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set SERVER_IP=%IP: =%
echo Server IP: %SERVER_IP%
echo.

echo Choose deployment method:
echo 1) Simple (npm start in separate windows)
echo 2) PM2 (recommended)
echo.
set /p deploy_type="Enter choice [1-2]: "

:: Check PM2
if "%deploy_type%"=="2" (
    where pm2 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Installing PM2...
        call npm install -g pm2
    )
)

:: Setup Backend
echo.
echo Setting up Backend...
cd backend

echo Installing backend dependencies...
call npm install

:: Create .env if not exists
if not exist ".env" (
    echo Creating backend .env...
    (
        echo NODE_ENV=production
        echo PORT=3001
        echo DATABASE_URL="file:./prod.db"
    ) > .env
)

echo Generating Prisma client...
call npx prisma generate

echo Running database migrations...
call npx prisma migrate deploy

echo Building backend...
call npm run build

echo Seeding database...
call npm run db:seed

:: Setup Frontend
echo.
echo Setting up Frontend...
cd ..\frontend

echo Installing frontend dependencies...
call npm install

:: Create .env.production if not exists
if not exist ".env.production" (
    echo Creating frontend .env.production...
    (
        echo NEXT_PUBLIC_API_URL=http://%SERVER_IP%:3001
    ) > .env.production
)

echo Building frontend...
call npm run build

:: Start services
echo.
echo Starting services...

if "%deploy_type%"=="2" (
    :: PM2 deployment
    cd ..\backend
    call pm2 delete backend 2>nul
    call pm2 start npm --name "backend" -- start
    
    cd ..\frontend
    call pm2 delete frontend 2>nul
    call pm2 start npm --name "frontend" -- start
    
    call pm2 save
    
    echo.
    echo Deployment complete!
    echo.
    echo Service status:
    call pm2 status
    echo.
    echo View logs: pm2 logs
    echo Restart: pm2 restart all
    echo Stop: pm2 stop all
) else (
    :: Simple deployment
    echo.
    echo Setup complete!
    echo.
    echo To start the services:
    echo.
    echo 1. Open Command Prompt, run:
    echo    cd %CD%\..\backend
    echo    npm start
    echo.
    echo 2. Open another Command Prompt, run:
    echo    cd %CD%\..\frontend
    echo    npm start
    echo.
)

echo.
echo Access your application:
echo   Frontend: http://%SERVER_IP%:3000
echo   Backend:  http://%SERVER_IP%:3001
echo.
echo Remember to open firewall ports 3000 and 3001!
echo.
echo Good luck with your hackathon!
pause

