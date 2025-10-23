@echo off
echo ============================================
echo Commandapp Next.js - Quick Start
echo ============================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [ERROR] .env.local file not found!
    echo.
    echo Please create a .env.local file with your Supabase credentials:
    echo.
    echo NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    echo.
    echo You can copy .env.local.example and fill in your values.
    echo.
    pause
    exit /b 1
)

echo [✓] Found .env.local file
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo [!] node_modules not found. Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo [✓] Dependencies installed successfully
    echo.
) else (
    echo [✓] Dependencies already installed
    echo.
)

echo ============================================
echo Starting development server...
echo ============================================
echo.
echo Your app will be available at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
