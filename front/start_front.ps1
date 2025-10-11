# Script para iniciar el frontend Next.js
Write-Host "Iniciando frontend de Siniestros..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot

# Instalar dependencias si es necesario
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias npm..." -ForegroundColor Yellow
    npm install
}

# Iniciar servidor de desarrollo
Write-Host "Ejecutando npm run dev..." -ForegroundColor Cyan
npm run dev
