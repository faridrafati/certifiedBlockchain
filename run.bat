@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM  CertifiedBlockchain DApp launcher (Windows)
REM
REM  Usage:
REM    run.bat            - start the Vite dev server (default)
REM    run.bat dev        - start the Vite dev server
REM    run.bat build      - production build into dist/
REM    run.bat preview    - serve the production build locally
REM    run.bat compile    - compile Solidity contracts (hardHat)
REM    run.bat node       - start a local Hardhat blockchain node
REM    run.bat help       - show this help
REM ============================================================

REM Always run from the directory this script lives in
cd /d "%~dp0"

REM --- Check prerequisites -----------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo         Download it from https://nodejs.org/
    exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed or not on PATH.
    exit /b 1
)

set "CMD=%~1"
if "%CMD%"=="" set "CMD=dev"

if /i "%CMD%"=="help"    goto :usage
if /i "%CMD%"=="dev"     goto :frontend
if /i "%CMD%"=="build"   goto :frontend
if /i "%CMD%"=="preview" goto :frontend
if /i "%CMD%"=="compile" goto :hardhat
if /i "%CMD%"=="node"    goto :hardhat

echo [ERROR] Unknown command: %CMD%
call :usage
exit /b 1

REM --- Frontend commands (dev / build / preview) -------------
:frontend
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        exit /b 1
    )
)
if /i "%CMD%"=="dev" (
    echo [INFO] Starting Vite dev server on http://localhost:3000 ...
    call npm run dev
) else if /i "%CMD%"=="build" (
    echo [INFO] Building production bundle into dist/ ...
    call npm run build
) else (
    echo [INFO] Serving production build ^(run "run.bat build" first^) ...
    call npm run preview
)
exit /b %errorlevel%

REM --- Hardhat commands (compile / node) ---------------------
:hardhat
if not exist "hardHat\node_modules" (
    echo [INFO] Installing Hardhat dependencies...
    pushd hardHat
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed in hardHat\.
        popd
        exit /b 1
    )
    popd
)
pushd hardHat
if /i "%CMD%"=="compile" (
    echo [INFO] Compiling Solidity contracts...
    call npx hardhat compile
) else (
    echo [INFO] Starting local Hardhat node on http://127.0.0.1:8545 ...
    call npx hardhat node
)
set "EXITCODE=%errorlevel%"
popd
exit /b %EXITCODE%

:usage
echo.
echo CertifiedBlockchain DApp launcher
echo.
echo   run.bat            start the Vite dev server (default)
echo   run.bat dev        start the Vite dev server
echo   run.bat build      production build into dist/
echo   run.bat preview    serve the production build locally
echo   run.bat compile    compile Solidity contracts (hardHat)
echo   run.bat node       start a local Hardhat blockchain node
echo   run.bat help       show this help
echo.
exit /b 0
