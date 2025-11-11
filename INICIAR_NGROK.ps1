# 🚀 SOLUCIÓN RÁPIDA: ngrok para HTTPS temporal

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 Túnel HTTPS con ngrok para tu API" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n⚠️  IMPORTANTE: Azure Front Door no está disponible en tu cuenta" -ForegroundColor Yellow
Write-Host "Usaremos ngrok como solución alternativa`n" -ForegroundColor Yellow

# Verificar si ngrok está instalado
Write-Host "📦 Verificando si ngrok está instalado..." -ForegroundColor Cyan

$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokInstalled) {
    Write-Host "❌ ngrok no está instalado" -ForegroundColor Red
    Write-Host "`n📥 Opciones para instalar ngrok:" -ForegroundColor Yellow
    Write-Host "1. Con Chocolatey: choco install ngrok" -ForegroundColor White
    Write-Host "2. Descargar de: https://ngrok.com/download" -ForegroundColor White
    Write-Host "`nEjecuta uno de estos comandos y luego vuelve a ejecutar este script`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok está instalado`n" -ForegroundColor Green

# URL de tu API
$apiUrl = "http://20.51.82.175:8000"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎯 Configuración:" -ForegroundColor Green
Write-Host "  API Backend: $apiUrl" -ForegroundColor White
Write-Host "  Túnel: HTTPS → HTTP (ngrok)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n🚀 Iniciando túnel ngrok...`n" -ForegroundColor Green
Write-Host "📝 INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. ngrok te dará una URL HTTPS como: https://abc123.ngrok.io" -ForegroundColor White
Write-Host "2. Copia esa URL" -ForegroundColor White
Write-Host "3. Actualiza NEXT_PUBLIC_API_URL en Vercel con esa URL" -ForegroundColor White
Write-Host "4. Redeploy tu frontend en Vercel" -ForegroundColor White
Write-Host "`n⚠️  La URL cambiará cada vez que reinicies ngrok (versión gratis)" -ForegroundColor Yellow
Write-Host "⚠️  Para URL permanente, considera ngrok Pro o Cloudflare Tunnel`n" -ForegroundColor Yellow

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el túnel cuando termines" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Iniciar ngrok
ngrok http $apiUrl
