# Script para actualizar la API en Azure con la configuración de CORS corregida
# Ejecutar desde la raíz del proyecto SiniestrosApi

Write-Host "🚀 Actualizando API en Azure con configuración de CORS corregida..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar conexión con Azure
Write-Host "1️⃣ Verificando conexión con Azure..." -ForegroundColor Yellow
az account show
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás conectado a Azure. Ejecuta 'az login' primero." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Conexión con Azure verificada" -ForegroundColor Green
Write-Host ""

# 2. Reconstruir la imagen Docker con el código actualizado
Write-Host "2️⃣ Reconstruyendo imagen Docker en Azure Container Registry..." -ForegroundColor Yellow
az acr build --registry scispregistry --image "siniestros-api:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imagen reconstruida exitosamente" -ForegroundColor Green
Write-Host ""

# 3. Reiniciar el contenedor para aplicar cambios
Write-Host "3️⃣ Reiniciando contenedor en Azure..." -ForegroundColor Yellow
az container restart --resource-group Rg-SCISP --name siniestros-api-container
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al reiniciar el contenedor" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Contenedor reiniciado" -ForegroundColor Green
Write-Host ""

# 4. Esperar unos segundos para que el contenedor inicie
Write-Host "⏳ Esperando 15 segundos para que el contenedor inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 5. Verificar logs del contenedor
Write-Host "4️⃣ Verificando logs del contenedor..." -ForegroundColor Yellow
az container logs --resource-group Rg-SCISP --name siniestros-api-container --tail 50
Write-Host ""

# 6. Verificar estado del contenedor
Write-Host "5️⃣ Verificando estado del contenedor..." -ForegroundColor Yellow
az container show --resource-group Rg-SCISP --name siniestros-api-container --query "{Estado:instanceView.state,IP:ipAddress.ip,FQDN:ipAddress.fqdn,Puerto:ipAddress.ports[0].port}" -o table
Write-Host ""

# 7. Probar el endpoint
Write-Host "6️⃣ Probando conexión a la API..." -ForegroundColor Yellow
$apiUrl = "http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000"
Write-Host "URL de la API: $apiUrl" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/inicio" -Method Get -ErrorAction Stop
    Write-Host "✅ API respondiendo correctamente:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "⚠️ La API aún no está lista o hay un error:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Actualización completada" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Notas importantes:" -ForegroundColor Yellow
Write-Host "   • CORS configurado para permitir TODAS las conexiones" -ForegroundColor White
Write-Host "   • No habrá restricciones de origen (allow_origins=['*'])" -ForegroundColor White
Write-Host "   • Cualquier aplicación puede conectarse a la API" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs de acceso:" -ForegroundColor Yellow
Write-Host "   • API Base: $apiUrl" -ForegroundColor White
Write-Host "   • Documentación: $apiUrl/docs" -ForegroundColor White
Write-Host "   • Health Check: $apiUrl/inicio" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Prueba desde el navegador o Postman:" -ForegroundColor Yellow
Write-Host "   GET $apiUrl/usuarios" -ForegroundColor White
Write-Host "   (Requiere autenticación Basic Auth)" -ForegroundColor Gray
Write-Host ""
