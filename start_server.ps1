# Script para iniciar el servidor FastAPI
Write-Host "Iniciando servidor de Siniestros API..." -ForegroundColor Green

# Cambiar al directorio del script
Set-Location -Path $PSScriptRoot

# Verificar que existe el entorno virtual
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "No se encontró el entorno virtual. Ejecuta setup.ps1 primero" -ForegroundColor Red
    exit 1
}

# Activar entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Verificar módulos críticos
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
try {
    & .\.venv\Scripts\python.exe -c "import jwt, passlib, fastapi, uvicorn; print('Todas las dependencias están instaladas')"
} catch {
    Write-Host "Error: Faltan dependencias. Instalando..." -ForegroundColor Red
    & .\.venv\Scripts\pip.exe install PyJWT[cryptography] passlib[bcrypt] fastapi uvicorn sqlalchemy pymysql python-multipart
}

# Iniciar servidor
Write-Host "Iniciando servidor en http://localhost:8000..." -ForegroundColor Green
Write-Host "Swagger UI disponible en: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow

& .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
