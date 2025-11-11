# =========================================================================
# ACTUALIZACIÓN URGENTE - CORS PARA VERCEL
# =========================================================================
# Ejecuta estos comandos en la terminal donde ya usaste Azure CLI
# =========================================================================

Write-Host "🚀 Actualizando API para permitir conexión desde Vercel..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Reconstruir imagen
Write-Host "1️⃣ Reconstruyendo imagen Docker..." -ForegroundColor Yellow
az acr build --registry scispregistry --image "siniestros-api:latest" .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Imagen reconstruida" -ForegroundColor Green
} else {
    Write-Host "❌ Error al reconstruir imagen" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Reiniciar contenedor
Write-Host "2️⃣ Reiniciando contenedor..." -ForegroundColor Yellow
az container restart --resource-group Rg-SCISP --name siniestros-api-container

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contenedor reiniciado" -ForegroundColor Green
} else {
    Write-Host "❌ Error al reiniciar contenedor" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Esperando 20 segundos para que el contenedor inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Paso 3: Ver logs
Write-Host "3️⃣ Verificando logs..." -ForegroundColor Yellow
az container logs --resource-group Rg-SCISP --name siniestros-api-container --tail 30

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Actualización completada" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Orígenes permitidos:" -ForegroundColor Yellow
Write-Host "   ✅ https://siniestros-api.vercel.app" -ForegroundColor Green
Write-Host "   ✅ https://*.vercel.app" -ForegroundColor Green
Write-Host "   ✅ http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 Configuración:" -ForegroundColor Yellow
Write-Host "   • allow_credentials: True (permite Basic Auth)" -ForegroundColor White
Write-Host "   • allow_methods: GET, POST, PUT, DELETE, OPTIONS, PATCH" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Prueba ahora desde tu frontend en Vercel" -ForegroundColor Yellow
Write-Host ""
