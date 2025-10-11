@echo off
cd /d "%~dp0"
echo Iniciando frontend de Siniestros...
if not exist node_modules (
    echo Instalando dependencias npm...
    npm install
)
echo Ejecutando npm run dev...
npm run dev
pause
