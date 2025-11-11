# ⚠️ Azure Front Door no disponible en cuenta Free/Student

## 🔴 Problema
Tu cuenta de Azure no permite crear Azure Front Door (requiere cuenta de pago).

## ✅ Soluciones Alternativas

### **Opción 1: Usar Cloudflare Tunnel (GRATIS y Fácil)** ⭐ RECOMENDADO

Cloudflare puede poner HTTPS delante de tu API gratuitamente.

#### Pasos:

1. **Instalar Cloudflare Tunnel**:
   ```powershell
   # Opción A: Con winget
   winget install --id Cloudflare.cloudflared
   
   # Opción B: Con Chocolatey
   choco install cloudflared
   
   # Opción C: Descargar manual
   # https://github.com/cloudflare/cloudflared/releases
   ```

2. **Crear túnel**:
   ```powershell
   # Login a Cloudflare
   cloudflared tunnel login
   
   # Crear túnel
   cloudflared tunnel create siniestros-api
   
   # Configurar túnel (esto creará un archivo config.yml)
   ```

3. **Crear archivo de configuración** `cloudflared-config.yml`:
   ```yaml
   tunnel: TU_TUNNEL_ID  # Lo obtienes del paso anterior
   credentials-file: C:\Users\MERZA\.cloudflared\TU_TUNNEL_ID.json
   
   ingress:
     - hostname: siniestros-api.tudominio.com
       service: http://20.51.82.175:8000
     - service: http_status:404
   ```

4. **Ejecutar túnel**:
   ```powershell
   cloudflared tunnel --config cloudflared-config.yml run
   ```

5. **Tu nueva URL HTTPS será**:
   ```
   https://siniestros-api.tudominio.com
   ```

---

### **Opción 2: Usar ngrok (Temporal para Testing)** ⚡ MÁS RÁPIDO

ngrok crea un túnel HTTPS temporal (gratis con limitaciones).

#### Pasos:

1. **Instalar ngrok**:
   ```powershell
   choco install ngrok
   # O descargar de: https://ngrok.com/download
   ```

2. **Crear túnel**:
   ```powershell
   ngrok http http://20.51.82.175:8000
   ```

3. **Copiar la URL HTTPS** que te da (será algo como `https://xyz123.ngrok.io`)

4. **Actualizar en Vercel**:
   ```
   NEXT_PUBLIC_API_URL=https://xyz123.ngrok.io
   ```

⚠️ **Limitaciones**:
- URL cambia cada vez que reinicias ngrok (versión gratis)
- No recomendado para producción
- Límite de 40 conexiones/minuto

---

### **Opción 3: Mover API a Vercel** 🚀 MEJOR PARA PRODUCCIÓN

Despliega tu FastAPI en Vercel como serverless function (HTTPS gratis).

#### Pasos:

1. **Crear `vercel.json`** en la raíz de tu proyecto:
   ```json
   {
     "builds": [
       {
         "src": "main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "main.py"
       }
     ]
   }
   ```

2. **Modificar `main.py`** para que sea compatible con Vercel:
   ```python
   # Al final del archivo, agregar:
   # Para Vercel
   app = app  # Vercel busca la variable 'app'
   ```

3. **Crear `requirements.txt`** (si no existe):
   ```
   fastapi
   uvicorn
   sqlalchemy
   pymysql
   passlib[bcrypt]
   python-dotenv
   ```

4. **Desplegar en Vercel**:
   ```powershell
   # Instalar Vercel CLI
   npm install -g vercel
   
   # Desplegar
   vercel --prod
   ```

5. **Tu URL HTTPS será**:
   ```
   https://tu-proyecto.vercel.app
   ```

---

### **Opción 4: Usar un Reverse Proxy en tu Container Instance**

Agregar Nginx o Caddy dentro de tu contenedor para manejar SSL.

#### Con Caddy (más fácil, SSL automático):

1. **Modificar tu `Dockerfile`**:
   ```dockerfile
   FROM python:3.11-slim
   
   # Instalar Caddy
   RUN apt-get update && apt-get install -y curl
   RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/setup.deb.sh' | bash
   RUN apt-get install -y caddy
   
   # Tu código existente
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   
   # Crear Caddyfile
   RUN echo 'localhost:443 { reverse_proxy localhost:8000 }' > /Caddyfile
   
   # Exponer puerto 443
   EXPOSE 443 8000
   
   # Iniciar Caddy y FastAPI
   CMD caddy run --config /Caddyfile & uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Rebuild y redeploy**

⚠️ **Problema**: Azure Container Instance no permite exponer puerto 443 directamente sin Application Gateway.

---

## 🎯 Recomendación para tu caso

### Para Testing/Desarrollo Rápido:
**Usa ngrok** (5 minutos de setup)

```powershell
# 1. Instalar
choco install ngrok

# 2. Crear túnel
ngrok http http://20.51.82.175:8000

# 3. Copiar URL HTTPS y actualizar en Vercel
```

### Para Producción:
**Opción A**: Mover API a Vercel (HTTPS gratis, sin costo adicional)

**Opción B**: Usar Cloudflare Tunnel (HTTPS gratis, más control)

**Opción C**: Actualizar a cuenta Azure de pago y usar Front Door

---

## 📝 Scripts Rápidos

### ngrok (Testing):
```powershell
# Archivo: INICIAR_NGROK.ps1
Write-Host "🚀 Iniciando túnel HTTPS con ngrok..." -ForegroundColor Green
ngrok http http://20.51.82.175:8000
```

### Cloudflare (Producción):
```powershell
# Archivo: INICIAR_CLOUDFLARE_TUNNEL.ps1
Write-Host "🚀 Iniciando Cloudflare Tunnel..." -ForegroundColor Green
cloudflared tunnel --url http://20.51.82.175:8000
```

---

## ❓ ¿Cuál prefieres?

1. **ngrok** = Más rápido, temporal, ideal para testing
2. **Cloudflare** = Gratis, permanente, mejor para producción
3. **Vercel** = Todo en un lugar, sin gestionar Azure
4. **Actualizar Azure** = Cuenta de pago requerida

¿Con cuál quieres seguir?
