# 🔒 Configurar Firewall de MySQL para App Service

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Configurar Firewall MySQL para permitir App Service" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# ========================
# CONFIGURACIÓN
# ========================

# Información del App Service (cuenta PERSONAL)
$appName = "siniestros-api"
$appResourceGroup = "Rg-SiniestrosAPI"

# Información de MySQL (cuenta ESTUDIANTIL)
$mysqlServer = "scisp"
$mysqlResourceGroup = "Rg-SCISP"

Write-Host "`n📋 Configuración:" -ForegroundColor Yellow
Write-Host "  App Service: $appName (cuenta personal)" -ForegroundColor White
Write-Host "  MySQL Server: $mysqlServer (cuenta estudiantil)" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Este script necesita acceso a AMBAS cuentas de Azure" -ForegroundColor White
Write-Host "Primero obtendremos las IPs del App Service de la cuenta personal" -ForegroundColor White
Write-Host "Luego cambiaremos a la cuenta estudiantil para configurar el firewall`n" -ForegroundColor White

# ========================
# PASO 1: Obtener IPs del App Service
# ========================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Paso 1/3: Obteniendo IPs salientes del App Service..." -ForegroundColor Cyan

$currentAccount = az account show --query name -o tsv
Write-Host "   Cuenta actual: $currentAccount" -ForegroundColor White

Write-Host "`n   Obteniendo IPs..." -ForegroundColor White

$outboundIPs = az webapp show `
  --name $appName `
  --resource-group $appResourceGroup `
  --query outboundIpAddresses `
  --output tsv

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($outboundIPs)) {
    Write-Host "❌ Error obteniendo IPs del App Service" -ForegroundColor Red
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "  - Estás logueado en la cuenta personal" -ForegroundColor White
    Write-Host "  - El App Service '$appName' existe" -ForegroundColor White
    Write-Host "  - El Resource Group '$appResourceGroup' es correcto" -ForegroundColor White
    exit 1
}

$ipArray = $outboundIPs -split ','
Write-Host "✅ IPs obtenidas:" -ForegroundColor Green
foreach ($ip in $ipArray) {
    Write-Host "   - $($ip.Trim())" -ForegroundColor White
}

# ========================
# PASO 2: Cambiar a cuenta estudiantil
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔄 Paso 2/3: Cambiar a cuenta estudiantil..." -ForegroundColor Cyan

Write-Host "`n📋 Cuentas disponibles:" -ForegroundColor Yellow
az account list --query "[].{Name:name, Subscription:id}" --output table

Write-Host "`n⚠️  Necesitas cambiar manualmente a tu cuenta ESTUDIANTIL" -ForegroundColor Yellow
Write-Host "Usa: az account set --subscription 'TU_SUSCRIPCION_ESTUDIANTIL'`n" -ForegroundColor White

$switchAccount = Read-Host "¿Ya cambiaste a la cuenta estudiantil? (s/n)"
if ($switchAccount -ne 's' -and $switchAccount -ne 'S') {
    Write-Host "`n📝 Para cambiar de cuenta, ejecuta:" -ForegroundColor Yellow
    Write-Host "az account set --subscription 'NOMBRE_SUSCRIPCION_ESTUDIANTIL'" -ForegroundColor White
    Write-Host "`nLuego vuelve a ejecutar este script`n" -ForegroundColor White
    exit 0
}

$currentAccount = az account show --query name -o tsv
Write-Host "✅ Cuenta actual: $currentAccount" -ForegroundColor Green

# ========================
# PASO 3: Configurar Firewall
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Paso 3/3: Configurando reglas de firewall..." -ForegroundColor Cyan

# Permitir servicios de Azure primero
Write-Host "`n   Creando regla para servicios de Azure..." -ForegroundColor White
az mysql server firewall-rule create `
  --resource-group $mysqlResourceGroup `
  --server-name $mysqlServer `
  --name AllowAllAzureIPs `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0 `
  --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Regla 'AllowAllAzureIPs' creada" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Regla ya existe o error creándola" -ForegroundColor Yellow
}

# Crear regla para cada IP específica del App Service
Write-Host "`n   Creando reglas específicas para App Service..." -ForegroundColor White
$counter = 1
foreach ($ip in $ipArray) {
    $ipTrimmed = $ip.Trim()
    $ruleName = "AllowAppService$counter"
    
    Write-Host "   Creando regla: $ruleName ($ipTrimmed)..." -ForegroundColor Gray
    
    az mysql server firewall-rule create `
      --resource-group $mysqlResourceGroup `
      --server-name $mysqlServer `
      --name $ruleName `
      --start-ip-address $ipTrimmed `
      --end-ip-address $ipTrimmed `
      --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Regla '$ruleName' creada" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Error creando regla o ya existe" -ForegroundColor Yellow
    }
    
    $counter++
}

# ========================
# RESUMEN
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "✅ Configuración de firewall completada" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n📋 Resumen:" -ForegroundColor Cyan
Write-Host "   MySQL Server: $mysqlServer.$mysqlServer.mysql.database.azure.com" -ForegroundColor White
Write-Host "   Reglas creadas: AllowAllAzureIPs + $($ipArray.Count) IPs específicas" -ForegroundColor White

Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verificar que el App Service puede conectarse:" -ForegroundColor White
Write-Host "   curl https://$appName.azurewebsites.net/inicio" -ForegroundColor Gray

Write-Host "`n2. Ver reglas de firewall creadas:" -ForegroundColor White
Write-Host "   az mysql server firewall-rule list --resource-group $mysqlResourceGroup --server-name $mysqlServer --output table" -ForegroundColor Gray

Write-Host "`n3. (Opcional) Eliminar regla permisiva si solo quieres IPs específicas:" -ForegroundColor White
Write-Host "   az mysql server firewall-rule delete --resource-group $mysqlResourceGroup --server-name $mysqlServer --name AllowAllAzureIPs" -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🔒 Nota de seguridad:" -ForegroundColor Cyan
Write-Host "La regla 'AllowAllAzureIPs' permite cualquier servicio de Azure." -ForegroundColor White
Write-Host "Para mayor seguridad, considera eliminarla y usar solo las IPs específicas." -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow

# Ver reglas actuales
$viewRules = Read-Host "¿Deseas ver las reglas de firewall actuales? (s/n)"
if ($viewRules -eq 's' -or $viewRules -eq 'S') {
    Write-Host "`n📊 Reglas de firewall actuales:`n" -ForegroundColor Cyan
    az mysql server firewall-rule list `
      --resource-group $mysqlResourceGroup `
      --server-name $mysqlServer `
      --output table
}
