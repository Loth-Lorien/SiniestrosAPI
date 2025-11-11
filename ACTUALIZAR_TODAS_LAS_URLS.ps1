# Script para actualizar TODAS las URLs hardcodeadas en el frontend
# Reemplaza la URL antigua por la nueva en todos los archivos

$oldUrl = "http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000"
$newUrl = "https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 ACTUALIZANDO TODAS LAS URLs HARDCODEADAS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL Antigua: " -NoNewline -ForegroundColor Red
Write-Host $oldUrl
Write-Host "URL Nueva:   " -NoNewline -ForegroundColor Green
Write-Host $newUrl
Write-Host ""

# Buscar todos los archivos TypeScript y TSX en el frontend
$files = Get-ChildItem -Path ".\front\src" -Include "*.ts", "*.tsx" -Recurse

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Contar cuántas veces aparece la URL antigua
    $matches = ([regex]::Matches($content, [regex]::Escape($oldUrl))).Count
    
    if ($matches -gt 0) {
        Write-Host "📝 $($file.Name)" -ForegroundColor Yellow
        Write-Host "   └─ Encontradas $matches ocurrencias" -ForegroundColor Gray
        
        # Reemplazar todas las ocurrencias
        $newContent = $content -replace [regex]::Escape($oldUrl), $newUrl
        
        # Guardar el archivo
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        
        $totalFiles++
        $totalReplacements += $matches
        
        Write-Host "   ✅ Actualizado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ACTUALIZACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   • Archivos modificados: $totalFiles" -ForegroundColor White
Write-Host "   • Reemplazos realizados: $totalReplacements" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Ahora debes:" -ForegroundColor Yellow
Write-Host "   1. Reiniciar el servidor de desarrollo del frontend" -ForegroundColor White
Write-Host "      cd front" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Hacer commit de los cambios:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Gray
Write-Host "      git commit -m 'fix: Actualizar URLs hardcodeadas a Azure App Service'" -ForegroundColor Gray
Write-Host ""
