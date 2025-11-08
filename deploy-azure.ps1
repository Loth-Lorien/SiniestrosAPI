# Script para Deploy Automatizado en Azure Container Instances
# Autor: GitHub Copilot
# Fecha: 2025-11-08

Write-Host "🚀 Deploy Backend FastAPI en Azure Container Instances" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# ===========================
# CONFIGURACIÓN - EDITA ESTOS VALORES
# ===========================

$RESOURCE_GROUP = "SiniestrosAPI-RG"
$LOCATION = "eastus"
$ACR_NAME = "siniestrosacr$(Get-Random -Minimum 100 -Maximum 999)"  # Nombre único
$CONTAINER_NAME = "siniestros-api"
$IMAGE_NAME = "siniestros-backend"
$DNS_NAME = "siniestros-api-$(Get-Random -Minimum 100 -Maximum 999)"  # Nombre único

# Configuración de Base de Datos
Write-Host "`n📝 Configuración de Base de Datos:" -ForegroundColor Yellow
$DB_HOST = Read-Host "MySQL Host (ejemplo: server.mysql.database.azure.com)"
$DB_USER = Read-Host "MySQL User (ejemplo: adminuser)"
$DB_PASSWORD = Read-Host "MySQL Password" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
$DB_NAME = Read-Host "Database Name (default: siniestros_db)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "siniestros_db" }

# Secret Key para JWT
$SECRET_KEY = Read-Host "Secret Key para JWT (dejar vacío para generar automáticamente)"
if ([string]::IsNullOrWhiteSpace($SECRET_KEY)) {
    $SECRET_KEY = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "✅ Secret Key generada automáticamente" -ForegroundColor Green
}

# ===========================
# VERIFICAR REQUISITOS
# ===========================

Write-Host "`n🔍 Verificando requisitos..." -ForegroundColor Yellow

# Verificar Azure CLI
try {
    $azVersion = az --version
    Write-Host "✅ Azure CLI instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI no encontrado. Instálalo desde: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no encontrado. Instálalo desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Verificar login en Azure
Write-Host "`n🔐 Verificando login en Azure..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    Write-Host "⚠️  No estás logueado en Azure. Iniciando login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al hacer login en Azure" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Login exitoso en Azure" -ForegroundColor Green

# ===========================
# CREAR RESOURCE GROUP
# ===========================

Write-Host "`n📦 Creando Resource Group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource Group '$RESOURCE_GROUP' creado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Resource Group ya existe (ok)" -ForegroundColor Yellow
}

# ===========================
# CREAR AZURE CONTAINER REGISTRY
# ===========================

Write-Host "`n🏗️  Creando Azure Container Registry..." -ForegroundColor Yellow
Write-Host "   Nombre: $ACR_NAME" -ForegroundColor Gray

az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --output none
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al crear ACR. Puede que el nombre ya exista." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Container Registry creado" -ForegroundColor Green

# Habilitar admin user
az acr update -n $ACR_NAME --admin-enabled true --output none
Write-Host "✅ Admin user habilitado" -ForegroundColor Green

# ===========================
# BUILD Y PUSH IMAGEN
# ===========================

Write-Host "`n🐳 Construyendo imagen Docker..." -ForegroundColor Yellow
Write-Host "   Esto puede tomar varios minutos..." -ForegroundColor Gray

az acr build --registry $ACR_NAME --image "${IMAGE_NAME}:latest" . --output table
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imagen construida y subida a ACR" -ForegroundColor Green

# ===========================
# OBTENER CREDENCIALES
# ===========================

Write-Host "`n🔑 Obteniendo credenciales..." -ForegroundColor Yellow
$ACR_SERVER = "${ACR_NAME}.azurecr.io"
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

Write-Host "✅ Credenciales obtenidas" -ForegroundColor Green

# ===========================
# DEPLOY CONTAINER INSTANCE
# ===========================

Write-Host "`n🚀 Desplegando Container Instance..." -ForegroundColor Yellow
Write-Host "   DNS Name: $DNS_NAME" -ForegroundColor Gray
Write-Host "   Esto puede tomar 2-3 minutos..." -ForegroundColor Gray

az container create `
  --resource-group $RESOURCE_GROUP `
  --name $CONTAINER_NAME `
  --image "${ACR_SERVER}/${IMAGE_NAME}:latest" `
  --dns-name-label $DNS_NAME `
  --ports 8000 `
  --cpu 1 `
  --memory 1.5 `
  --registry-login-server $ACR_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --environment-variables `
    DB_HOST=$DB_HOST `
    DB_PORT=3306 `
    DB_USER=$DB_USER `
    DB_NAME=$DB_NAME `
    SECRET_KEY=$SECRET_KEY `
    ALGORITHM=HS256 `
    ACCESS_TOKEN_EXPIRE_MINUTES=30 `
  --secure-environment-variables `
    DB_PASSWORD=$DB_PASSWORD_PLAIN `
  --restart-policy Always `
  --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al desplegar el contenedor" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container Instance desplegado" -ForegroundColor Green

# ===========================
# OBTENER URL Y VERIFICAR
# ===========================

Write-Host "`n🌐 Obteniendo URL pública..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # Esperar a que el contenedor inicie

$FQDN = az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query ipAddress.fqdn -o tsv
$API_URL = "http://${FQDN}:8000"

Write-Host "`n" + "=" * 60 -ForegroundColor Green
Write-Host "✅ ¡DEPLOY COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green

Write-Host "`n📍 URL de tu API:" -ForegroundColor Cyan
Write-Host "   $API_URL" -ForegroundColor White

Write-Host "`n🔍 Verificando API..." -ForegroundColor Yellow
Start-Sleep -Seconds 10  # Esperar a que la API inicie

try {
    $response = Invoke-RestMethod -Uri $API_URL -TimeoutSec 30
    Write-Host "✅ API respondiendo correctamente" -ForegroundColor Green
    Write-Host "   Respuesta: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  API aún no responde. Esto es normal, puede tomar 1-2 minutos más." -ForegroundColor Yellow
    Write-Host "   Verifica los logs con:" -ForegroundColor Gray
    Write-Host "   az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME" -ForegroundColor White
}

# ===========================
# INFORMACIÓN FINAL
# ===========================

Write-Host "`n📋 Información del Deployment:" -ForegroundColor Cyan
Write-Host "   Resource Group: $RESOURCE_GROUP" -ForegroundColor White
Write-Host "   Container Registry: $ACR_NAME" -ForegroundColor White
Write-Host "   Container Name: $CONTAINER_NAME" -ForegroundColor White
Write-Host "   Location: $LOCATION" -ForegroundColor White

Write-Host "`n🔧 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   Ver logs:" -ForegroundColor White
Write-Host "   az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --follow" -ForegroundColor Gray

Write-Host "`n   Ver estado:" -ForegroundColor White
Write-Host "   az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query instanceView.state" -ForegroundColor Gray

Write-Host "`n   Reiniciar:" -ForegroundColor White
Write-Host "   az container restart --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME" -ForegroundColor Gray

Write-Host "`n   Detener:" -ForegroundColor White
Write-Host "   az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME" -ForegroundColor Gray

Write-Host "`n   Eliminar:" -ForegroundColor White
Write-Host "   az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes" -ForegroundColor Gray

Write-Host "`n🎯 Próximo paso:" -ForegroundColor Cyan
Write-Host "   Actualiza la variable de entorno en Vercel:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_API_URL=$API_URL" -ForegroundColor Yellow

Write-Host "`n💰 Costos estimados:" -ForegroundColor Cyan
Write-Host "   - ACR Basic: ~`$5/mes" -ForegroundColor White
Write-Host "   - ACI (1 vCore, 1.5GB): ~`$36/mes" -ForegroundColor White
Write-Host "   Total: ~`$41/mes (sin MySQL)" -ForegroundColor White

Write-Host "`n✨ ¡Listo! Tu backend está desplegado en Azure. 🎉" -ForegroundColor Green
Write-Host ""
