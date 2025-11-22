@echo off
title Signal Synthesis Suite Server
cd /d "%~dp0"

echo ========================================
echo   Signal Synthesis Suite Server
echo ========================================
echo.
echo Starting WebSocket server for UDP communication...
echo Server will run on port 9000
echo.

node server.js

echo.
echo Server stopped. Press any key to exit...
pause >nul
