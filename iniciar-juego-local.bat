@echo off
setlocal
cd /d "%~dp0"

echo Iniciando el juego desde: %CD%
echo Abre http://127.0.0.1:5173/ cuando Vite indique que esta listo.
echo Deja esta ventana abierta mientras juegas.
echo.

call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort

echo.
echo El servidor se detuvo. Revisa el mensaje anterior.
pause
