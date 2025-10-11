# Script de instalación automática para el Sistema de Siniestros
Write-Host "=== INSTALADOR AUTOMÁTICO - SISTEMA DE SINIESTROS ===" -ForegroundColor Green

# Cambiar al directorio del script
Set-Location -Path $PSScriptRoot

# Crear entorno virtual si no existe
if (-not (Test-Path ".venv")) {
    Write-Host "Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al crear el entorno virtual. Asegúrate de que Python esté instalado." -ForegroundColor Red
        exit 1
    }
}

# Activar entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Actualizar pip
Write-Host "Actualizando pip..." -ForegroundColor Yellow
& .\.venv\Scripts\python.exe -m pip install --upgrade pip

# Instalar dependencias básicas
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
$packages = @(
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy",
    "pymysql",
    "python-multipart",
    "PyJWT[cryptography]",
    "passlib[bcrypt]",
    "python-dotenv"
)

foreach ($package in $packages) {
    Write-Host "Instalando $package..." -ForegroundColor Cyan
    & .\.venv\Scripts\pip.exe install $package
}

# Generar requirements.txt
Write-Host "Generando requirements.txt..." -ForegroundColor Yellow
& .\.venv\Scripts\pip.exe freeze > requirements.txt

# Verificar instalación
Write-Host "Verificando instalación..." -ForegroundColor Yellow
try {
    & .\.venv\Scripts\python.exe -c "import fastapi, uvicorn, sqlalchemy, jwt, passlib; print('✓ Todas las dependencias están correctamente instaladas')"
} catch {
    Write-Host "❌ Error en la verificación de dependencias" -ForegroundColor Red
    exit 1
}

# Comprobar archivo main.py
if (-not (Test-Path "main.py")) {
    Write-Host "❌ Error: No se encontró el archivo main.py" -ForegroundColor Red
    exit 1
}

# Compilar main.py para verificar sintaxis
Write-Host "Verificando sintaxis de main.py..." -ForegroundColor Yellow
try {
    & .\.venv\Scripts\python.exe -m py_compile main.py
    Write-Host "✓ main.py compilado correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en main.py:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== INSTALACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el servidor, ejecuta:" -ForegroundColor Cyan
Write-Host "  .\start_server.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "El servidor estará disponible en:" -ForegroundColor Cyan
Write-Host "  http://localhost:8000" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/docs (Swagger UI)" -ForegroundColor Yellow
Write-Host ""

# Preguntar si iniciar el servidor ahora
$response = Read-Host "¿Deseas iniciar el servidor ahora? (s/n)"
if ($response -eq "s" -or $response -eq "S" -or $response -eq "y" -or $response -eq "Y") {
    Write-Host "Iniciando servidor..." -ForegroundColor Green
    & .\start_server.ps1
}
