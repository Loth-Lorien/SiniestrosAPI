# 🔐 Solución: Habilitar HTTPS para API en Azure

## ❌ Problema Actual
- **API Backend**: `http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000` (HTTP)
- **Frontend Vercel**: `https://siniestros-api.vercel.app` (HTTPS)
- **Resultado**: Navegadores bloquean peticiones HTTP desde HTTPS (Mixed Content)

## ✅ Soluciones Disponibles

### **Opción 1: Azure Application Gateway con HTTPS** (Recomendado para Producción)

#### Ventajas:
- ✅ SSL/TLS terminado por Azure
- ✅ Certificados SSL automáticos
- ✅ Mejor seguridad y rendimiento
- ✅ Escalabilidad automática

#### Pasos:
1. **Crear Application Gateway**
   ```powershell
   # Crear Application Gateway con SSL
   az network application-gateway create `
     --name siniestros-app-gateway `
     --resource-group tu-resource-group `
     --location westus2 `
     --sku Standard_v2 `
     --capacity 2 `
     --vnet-name tu-vnet `
     --subnet tu-subnet `
     --public-ip-address gateway-public-ip `
     --http-settings-protocol Http `
     --http-settings-port 8000 `
     --frontend-port 443
   ```

2. **Configurar Backend Pool**
   ```powershell
   az network application-gateway address-pool create `
     --resource-group tu-resource-group `
     --gateway-name siniestros-app-gateway `
     --name siniestros-backend-pool `
     --servers siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io
   ```

3. **Configurar Certificado SSL**
   - Opción A: Usar Azure Managed Certificate (gratis)
   - Opción B: Subir tu propio certificado SSL

4. **Actualizar NEXT_PUBLIC_API_URL en Vercel**
   ```
   NEXT_PUBLIC_API_URL=https://tu-dominio.azurefd.net
   ```

---

### **Opción 2: Azure Front Door** (Más simple, CDN integrado)

#### Ventajas:
- ✅ Configuración más simple
- ✅ SSL automático
- ✅ CDN global incluido
- ✅ DDoS protection

#### Pasos:
1. **Crear Azure Front Door**
   ```powershell
   az afd profile create `
     --resource-group tu-resource-group `
     --profile-name siniestros-frontdoor `
     --sku Standard_AzureFrontDoor
   ```

2. **Crear Endpoint**
   ```powershell
   az afd endpoint create `
     --resource-group tu-resource-group `
     --profile-name siniestros-frontdoor `
     --endpoint-name siniestros-api `
     --enabled-state Enabled
   ```

3. **Configurar Origin**
   ```powershell
   az afd origin create `
     --resource-group tu-resource-group `
     --profile-name siniestros-frontdoor `
     --origin-group-name default-origin-group `
     --origin-name aci-backend `
     --host-name siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io `
     --origin-host-header siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io `
     --priority 1 `
     --weight 1000 `
     --http-port 8000 `
     --https-port 443
   ```

4. **Tu nueva URL HTTPS**
   ```
   https://siniestros-api-xxxxx.azurefd.net
   ```

---

### **Opción 3: ngrok o Cloudflare Tunnel** (Rápido para Testing)

#### Para pruebas rápidas (NO para producción):

**Con ngrok:**
```powershell
# Instalar ngrok
choco install ngrok

# Crear túnel HTTPS hacia tu API
ngrok http http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000
```

**Con Cloudflare Tunnel:**
```powershell
# Instalar cloudflared
choco install cloudflared

# Crear túnel
cloudflared tunnel --url http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000
```

---

### **Opción 4: Desplegar Backend en Vercel** (Más Simple)

Si tu API es FastAPI, puedes desplegarla en Vercel como serverless function:

1. **Crear `api/index.py`** en tu proyecto:
   ```python
   from main import app
   import uvicorn
   
   # Vercel serverless handler
   def handler(request):
       return app(request.scope, request.receive, request.send)
   ```

2. **Crear `vercel.json`**:
   ```json
   {
     "builds": [
       {
         "src": "api/index.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "api/index.py"
       }
     ]
   }
   ```

3. **Desplegar**:
   ```bash
   vercel --prod
   ```

---

## 🚀 Recomendación para tu caso

**Para producción inmediata:**
- Usa **Azure Front Door** (más fácil, SSL automático)

**Para testing rápido:**
- Usa **ngrok** temporalmente mientras configuras Azure

**Para largo plazo:**
- Migra a **Application Gateway + Custom Domain + SSL**

---

## 📝 Actualizar Variables de Entorno

Una vez que tengas tu URL HTTPS, actualiza en Vercel:

1. **En dashboard de Vercel**:
   - Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL` = `https://tu-nueva-url-https`

2. **Redeploy frontend**:
   ```bash
   git push
   # O manualmente en Vercel Dashboard
   ```

---

## ⚠️ Importante

- **NO** uses soluciones temporales como ngrok en producción
- **SÍ** configura CORS correctamente en tu backend (ya está hecho)
- **SÍ** usa Azure Front Door o Application Gateway para producción
- **SÍ** considera mover toda tu infraestructura a Vercel si es posible

---

## 🔗 Recursos Adicionales

- [Azure Application Gateway Docs](https://learn.microsoft.com/azure/application-gateway/)
- [Azure Front Door Docs](https://learn.microsoft.com/azure/frontdoor/)
- [FastAPI on Vercel](https://vercel.com/guides/deploying-fastapi-with-vercel)

