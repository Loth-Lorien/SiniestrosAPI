# Script para aumentar los timeouts de 5 a 30 segundos en el frontend

$files = Get-ChildItem -Path ".\front\src" -Include "*.tsx", "*.ts" -Recurse

$totalChanges = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = $content
    
    # Cambiar timeout: 5000 a timeout: 30000
    $newContent = $newContent -replace 'timeout:\s*5000', 'timeout: 30000'
    
    # Cambiar AbortSignal.timeout(5000) a AbortSignal.timeout(30000)
    $newContent = $newContent -replace 'AbortSignal\.timeout\(5000\)', 'AbortSignal.timeout(30000)'
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "✅ $($file.Name)" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host "`n✅ Archivos modificados: $totalChanges" -ForegroundColor Cyan
Write-Host "⏱️  Timeout aumentado de 5 segundos a 30 segundos" -ForegroundColor Yellow
