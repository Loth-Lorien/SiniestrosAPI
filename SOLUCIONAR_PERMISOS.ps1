# Script para solucionar el problema de permisos en vista_sucursales
# Este script ejecuta los comandos SQL necesarios en tu base de datos MySQL de Azure

$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 SOLUCIONANDO PERMISOS DE VISTA_SUCURSALES" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Configuración de la base de datos
$server = "siniestros-mysql-db.mysql.database.azure.com"
$database = "siniestros_scisp"
$adminUser = "adminuser"

Write-Host "📋 Información de la base de datos:" -ForegroundColor Cyan
Write-Host "   • Servidor: $server" -ForegroundColor White
Write-Host "   • Base de datos: $database" -ForegroundColor White
Write-Host "   • Usuario admin: $adminUser`n" -ForegroundColor White

# Solicitar contraseña
Write-Host "🔐 Ingresa la contraseña del usuario adminuser:" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "`n⚙️  Opciones disponibles:`n" -ForegroundColor Cyan
Write-Host "1. Recrear vista con SQL SECURITY INVOKER (RECOMENDADO)" -ForegroundColor Green
Write-Host "   - Modifica la vista para usar permisos del usuario actual" -ForegroundColor Gray
Write-Host "   - Otorga permisos necesarios a 'perilla'`n" -ForegroundColor Gray

Write-Host "2. Solo otorgar permisos al usuario 'perilla'" -ForegroundColor Yellow
Write-Host "   - No modifica la vista existente" -ForegroundColor Gray
Write-Host "   - Solo otorga permisos SELECT`n" -ForegroundColor Gray

$opcion = Read-Host "Selecciona una opción (1 o 2)"

# Verificar que mysql.exe esté disponible
$mysqlPath = "mysql"
try {
    $null = Get-Command mysql -ErrorAction Stop
    Write-Host "`n✅ MySQL cliente encontrado`n" -ForegroundColor Green
} catch {
    Write-Host "`n❌ ERROR: MySQL cliente no encontrado" -ForegroundColor Red
    Write-Host "   Instala MySQL Workbench o MySQL CLI desde: https://dev.mysql.com/downloads/`n" -ForegroundColor Yellow
    Write-Host "   O ejecuta manualmente el archivo SQL correspondiente desde Azure Portal`n" -ForegroundColor Yellow
    exit 1
}

# Seleccionar el archivo SQL según la opción
$sqlFile = if ($opcion -eq "1") {
    "RECREAR_VISTA_SUCURSALES.sql"
} else {
    "SOLO_PERMISOS_PERILLA.sql"
}

Write-Host "📄 Ejecutando script: $sqlFile`n" -ForegroundColor Cyan

# Ejecutar el script SQL
try {
    $command = "mysql -h $server -u $adminUser -p$password --ssl-mode=REQUIRED $database"
    Get-Content $sqlFile | & mysql -h $server -u $adminUser "-p$password" --ssl-mode=REQUIRED $database 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "✅ SCRIPT EJECUTADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
        
        Write-Host "🎉 La vista_sucursales ahora debería funcionar correctamente`n" -ForegroundColor Green
        
        Write-Host "🧪 Prueba ahora:" -ForegroundColor Cyan
        Write-Host "   1. Ve a tu frontend: http://localhost:3002/sucursales" -ForegroundColor White
        Write-Host "   2. O prueba la API: https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net/sucursales`n" -ForegroundColor White
    } else {
        throw "Error al ejecutar el script SQL"
    }
} catch {
    Write-Host "`n❌ ERROR al ejecutar el script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n💡 Alternativa: Ejecuta manualmente desde Azure Portal" -ForegroundColor Yellow
    Write-Host "   1. Ve a: https://portal.azure.com" -ForegroundColor White
    Write-Host "   2. Busca: siniestros-mysql-db" -ForegroundColor White
    Write-Host "   3. Abre: Query editor o Azure Cloud Shell" -ForegroundColor White
    Write-Host "   4. Copia y pega el contenido de: $sqlFile`n" -ForegroundColor White
}

Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
