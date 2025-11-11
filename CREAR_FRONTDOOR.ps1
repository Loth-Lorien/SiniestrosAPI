# 🚀 Script para crear Azure Front Door con HTTPS
# Este script crea un Front Door que pone HTTPS delante de tu Container Instance

# Variables - EDITA ESTAS
$resourceGroup = "Rg-SCISP"  # Tu resource group
$location = "westus2"
$frontDoorName = "siniestros-api-frontdoor"
$endpointName = "siniestros-api"
$originHostName = "siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io"  # Tu ACI FQDN

Write-Host "🚀 Creando Azure Front Door para HTTPS..." -ForegroundColor Green

# 1. Crear Front Door Profile
Write-Host "`n📦 Paso 1/5: Creando Front Door Profile..." -ForegroundColor Cyan
az afd profile create `
  --resource-group $resourceGroup `
  --profile-name $frontDoorName `
  --sku Standard_AzureFrontDoor

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando Front Door Profile" -ForegroundColor Red
    exit 1
}

# 2. Crear Endpoint (este será tu nueva URL HTTPS)
Write-Host "`n🌐 Paso 2/5: Creando Endpoint HTTPS..." -ForegroundColor Cyan
az afd endpoint create `
  --resource-group $resourceGroup `
  --profile-name $frontDoorName `
  --endpoint-name $endpointName `
  --enabled-state Enabled

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando Endpoint" -ForegroundColor Red
    exit 1
}

# 3. Crear Origin Group
Write-Host "`n🔗 Paso 3/5: Creando Origin Group..." -ForegroundColor Cyan
az afd origin-group create `
  --resource-group $resourceGroup `
  --profile-name $frontDoorName `
  --origin-group-name default-origin-group `
  --probe-request-type GET `
  --probe-protocol Http `
  --probe-interval-in-seconds 120 `
  --probe-path / `
  --sample-size 4 `
  --successful-samples-required 3 `
  --additional-latency-in-milliseconds 50

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando Origin Group" -ForegroundColor Red
    exit 1
}

# 4. Crear Origin (apunta a tu Container Instance)
Write-Host "`n🎯 Paso 4/5: Configurando origen (tu Container Instance)..." -ForegroundColor Cyan
az afd origin create `
  --resource-group $resourceGroup `
  --profile-name $frontDoorName `
  --origin-group-name default-origin-group `
  --origin-name aci-backend `
  --host-name $originHostName `
  --origin-host-header $originHostName `
  --priority 1 `
  --weight 1000 `
  --http-port 8000 `
  --https-port 443 `
  --enabled-state Enabled

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando Origin" -ForegroundColor Red
    exit 1
}

# 5. Crear Route (configura el enrutamiento)
Write-Host "`n🛣️ Paso 5/5: Configurando rutas..." -ForegroundColor Cyan
az afd route create `
  --resource-group $resourceGroup `
  --profile-name $frontDoorName `
  --endpoint-name $endpointName `
  --route-name default-route `
  --origin-group default-origin-group `
  --supported-protocols Http Https `
  --https-redirect Enabled `
  --forwarding-protocol HttpOnly `
  --patterns-to-match "/*"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando Route" -ForegroundColor Red
    exit 1
}

# Obtener la URL del endpoint
Write-Host "`n✅ Front Door creado exitosamente!" -ForegroundColor Green
Write-Host "`n📋 Obteniendo tu nueva URL HTTPS..." -ForegroundColor Cyan

$endpointUrl = az afd endpoint show `
  --resource-group $resourceGroup `
  --profile-name $frontDoorName `
  --endpoint-name $endpointName `
  --query hostName `
  --output tsv

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🎉 ¡LISTO! Tu nueva URL HTTPS es:" -ForegroundColor Green
Write-Host "`nhttps://$endpointUrl" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Actualiza NEXT_PUBLIC_API_URL en Vercel a: https://$endpointUrl" -ForegroundColor White
Write-Host "2. Actualiza CORS en main.py para incluir esta URL" -ForegroundColor White
Write-Host "3. Redeploy tu backend y frontend" -ForegroundColor White
Write-Host "`n⏱️ Nota: Front Door puede tardar 5-10 minutos en estar completamente activo" -ForegroundColor Yellow
