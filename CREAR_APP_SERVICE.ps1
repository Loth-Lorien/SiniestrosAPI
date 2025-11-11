# 🚀 Script Automático para Crear Azure App Service

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 Creando Azure App Service para FastAPI con HTTPS" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# ========================
# CONFIGURACIÓN - EDITA ESTOS VALORES
# ========================

$appName = "siniestros-api"  # Nombre del App Service (será: siniestros-api.azurewebsites.net)
$resourceGroup = "Rg-SiniestrosAPI"  # Resource group en tu cuenta PERSONAL
$location = "westus2"  # Misma región que tu base de datos
$sku = "B1"  # B1 = Basic ($13/mes), F1 = Free ($0), S1 = Standard ($55/mes)
$runtime = "PYTHON|3.11"

# Cadena de conexión a tu base de datos (cuenta estudiantil)
$databaseUrl = "mysql+pymysql://perilla:1016110530Np.@scisp.mysql.database.azure.com:3306/siniestros_scisp?charset=utf8mb4&ssl_ca=&ssl_verify_cert=true"

Write-Host "`n📋 Configuración:" -ForegroundColor Yellow
Write-Host "  App Name: $appName" -ForegroundColor White
Write-Host "  Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "  Location: $location" -ForegroundColor White
Write-Host "  SKU: $sku" -ForegroundColor White
Write-Host "  URL final: https://$appName.azurewebsites.net" -ForegroundColor Cyan

Write-Host "`n⚠️  IMPORTANTE: Asegúrate de estar logueado en tu cuenta PERSONAL de Azure" -ForegroundColor Yellow
Write-Host "Verifica con: az account show`n" -ForegroundColor White

$continue = Read-Host "¿Continuar? (s/n)"
if ($continue -ne 's' -and $continue -ne 'S') {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

# ========================
# PASO 1: Verificar cuenta de Azure
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Paso 1/8: Verificando cuenta de Azure..." -ForegroundColor Cyan

$account = az account show --output json | ConvertFrom-Json
Write-Host "✅ Logueado como: $($account.user.name)" -ForegroundColor Green
Write-Host "   Suscripción: $($account.name)" -ForegroundColor White

# ========================
# PASO 2: Crear Resource Group
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 Paso 2/8: Creando Resource Group..." -ForegroundColor Cyan

$rgExists = az group exists --name $resourceGroup
if ($rgExists -eq "true") {
    Write-Host "⚠️  Resource Group '$resourceGroup' ya existe, usando existente" -ForegroundColor Yellow
} else {
    az group create --name $resourceGroup --location $location --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Resource Group creado: $resourceGroup" -ForegroundColor Green
    } else {
        Write-Host "❌ Error creando Resource Group" -ForegroundColor Red
        exit 1
    }
}

# ========================
# PASO 3: Crear App Service Plan
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "⚙️  Paso 3/8: Creando App Service Plan..." -ForegroundColor Cyan

$planName = "$appName-plan"

az appservice plan create `
  --name $planName `
  --resource-group $resourceGroup `
  --location $location `
  --is-linux `
  --sku $sku `
  --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service Plan creado: $planName" -ForegroundColor Green
} else {
    Write-Host "❌ Error creando App Service Plan" -ForegroundColor Red
    exit 1
}

# ========================
# PASO 4: Crear Web App
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 Paso 4/8: Creando Web App..." -ForegroundColor Cyan

az webapp create `
  --name $appName `
  --resource-group $resourceGroup `
  --plan $planName `
  --runtime $runtime `
  --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Web App creada: $appName" -ForegroundColor Green
    Write-Host "   URL: https://$appName.azurewebsites.net" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error creando Web App" -ForegroundColor Red
    exit 1
}

# ========================
# PASO 5: Configurar Variables de Entorno
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Paso 5/8: Configurando variables de entorno..." -ForegroundColor Cyan

az webapp config appsettings set `
  --name $appName `
  --resource-group $resourceGroup `
  --settings `
    DATABASE_URL="$databaseUrl" `
    PYTHON_VERSION="3.11" `
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
    WEBSITES_PORT="8000" `
    WEBSITE_HTTPLOGGING_RETENTION_DAYS="7" `
  --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error configurando variables (puedes hacerlo manualmente)" -ForegroundColor Yellow
}

# ========================
# PASO 6: Configurar Startup Command
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 Paso 6/8: Configurando comando de inicio..." -ForegroundColor Cyan

az webapp config set `
  --name $appName `
  --resource-group $resourceGroup `
  --startup-file "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --timeout 600" `
  --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Comando de inicio configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error configurando startup command" -ForegroundColor Yellow
}

# ========================
# PASO 7: Habilitar HTTPS Only
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔒 Paso 7/8: Habilitando HTTPS obligatorio..." -ForegroundColor Cyan

az webapp update `
  --name $appName `
  --resource-group $resourceGroup `
  --set httpsOnly=true `
  --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ HTTPS obligatorio habilitado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error habilitando HTTPS" -ForegroundColor Yellow
}

# ========================
# PASO 8: Preparar Despliegue
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 Paso 8/8: Preparando código para despliegue..." -ForegroundColor Cyan

# Crear archivo ZIP con el código
$excludeList = @(
    ".git",
    ".venv",
    "__pycache__",
    "*.pyc",
    ".env",
    ".env.local",
    "node_modules",
    "front",
    "*.md",
    "*.ps1",
    "deploy.zip"
)

Write-Host "   Creando archivo ZIP..." -ForegroundColor White

# Crear lista de archivos a incluir
$filesToInclude = @(
    "main.py",
    "requirements.txt",
    "boletin_generator.py",
    "app",
    "Boletin"
)

# Verificar que existan los archivos principales
$allFilesExist = $true
foreach ($file in @("main.py", "requirements.txt")) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Archivo '$file' no encontrado" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`n⚠️  Algunos archivos necesarios no existen" -ForegroundColor Yellow
    Write-Host "Por favor, despliega manualmente usando el portal o Git" -ForegroundColor Yellow
} else {
    # Crear ZIP
    if (Test-Path "deploy.zip") {
        Remove-Item "deploy.zip" -Force
    }
    
    Compress-Archive -Path $filesToInclude -DestinationPath "deploy.zip" -Force
    
    Write-Host "✅ Archivo deploy.zip creado" -ForegroundColor Green
    Write-Host "`n📤 Desplegando código..." -ForegroundColor Cyan
    
    az webapp deployment source config-zip `
      --name $appName `
      --resource-group $resourceGroup `
      --src deploy.zip `
      --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Código desplegado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error desplegando código" -ForegroundColor Yellow
        Write-Host "Puedes desplegar manualmente el archivo deploy.zip desde el portal" -ForegroundColor Yellow
    }
    
    # Limpiar
    Remove-Item "deploy.zip" -Force -ErrorAction SilentlyContinue
}

# ========================
# RESUMEN FINAL
# ========================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🎉 ¡App Service creado exitosamente!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n📋 Información del servicio:" -ForegroundColor Cyan
Write-Host "   Nombre: $appName" -ForegroundColor White
Write-Host "   Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "   URL: https://$appName.azurewebsites.net" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "   Plan: $sku" -ForegroundColor White

Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verificar que la API responda:" -ForegroundColor White
Write-Host "   curl https://$appName.azurewebsites.net/" -ForegroundColor Gray

Write-Host "`n2. Ver logs en tiempo real:" -ForegroundColor White
Write-Host "   az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor Gray

Write-Host "`n3. Actualizar NEXT_PUBLIC_API_URL en Vercel:" -ForegroundColor White
Write-Host "   https://$appName.azurewebsites.net" -ForegroundColor Gray

Write-Host "`n4. Configurar firewall de MySQL (cuenta estudiantil):" -ForegroundColor White
Write-Host "   Ejecuta: .\CONFIGURAR_FIREWALL_MYSQL.ps1" -ForegroundColor Gray

Write-Host "`n5. Redeploy frontend en Vercel" -ForegroundColor White

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "⏱️  Nota: El despliegue puede tardar 2-5 minutos en estar listo" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow

# Opción para ver logs inmediatamente
$viewLogs = Read-Host "¿Deseas ver los logs ahora? (s/n)"
if ($viewLogs -eq 's' -or $viewLogs -eq 'S') {
    Write-Host "`n📊 Mostrando logs (Ctrl+C para salir)...`n" -ForegroundColor Cyan
    az webapp log tail --name $appName --resource-group $resourceGroup
}
