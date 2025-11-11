# 🚀 GUÍA RÁPIDA: Azure Front Door para HTTPS

## ⚡ Solución Rápida - Configurar HTTPS en 10 minutos

### Paso 1: Crear Azure Front Door (Portal Web)

1. **Ir a Azure Portal**: https://portal.azure.com
2. **Buscar "Front Door"** en el buscador superior
3. **Click en "+ Create"**
4. **Configuración básica**:
   - Resource Group: `(tu resource group)`
   - Name: `siniestros-api-frontdoor`
   - Tier: **Standard** (más barato)
   - Endpoint name: `siniestros-api`
   
5. **Configurar Origin**:
   - Origin Type: **Custom**
   - Origin host name: `siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io`
   - Origin host header: `siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io`
   - HTTP port: `8000`
   - HTTPS port: `443`
   - Priority: `1`
   - Weight: `1000`

6. **Configurar Route**:
   - Patterns to match: `/*`
   - Accepted protocols: **HTTP and HTTPS**
   - Redirect HTTP to HTTPS: ✅ Enabled
   - Forwarding protocol: **HTTP only** (porque tu ACI usa HTTP)

7. **Review + Create**

---

### Paso 2: Esperar Despliegue (5-10 minutos)

Azure Front Door tardará unos minutos en desplegarse.

**Tu nueva URL será:**
```
https://siniestros-api-xxxxx.azurefd.net
```

---

### Paso 3: Actualizar CORS en Backend

Edita `main.py` y agrega el nuevo origen:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://siniestros-api.vercel.app",
        "https://siniestros-api-xxxxx.azurefd.net",  # ← Tu nuevo Front Door
        "https://*.vercel.app",
        "http://localhost:3000",
        "*"  # Temporal para testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
```

---

### Paso 4: Actualizar Variable de Entorno en Vercel

1. **Ir a Vercel Dashboard**: https://vercel.com/dashboard
2. **Seleccionar tu proyecto**
3. **Settings → Environment Variables**
4. **Editar `NEXT_PUBLIC_API_URL`**:
   ```
   https://siniestros-api-xxxxx.azurefd.net
   ```
5. **Save**

---

### Paso 5: Redeploy Backend en Azure

```powershell
# Reconstruir imagen Docker con CORS actualizado
docker build -t siniestros-api:latest .

# Tag para Azure Container Registry (si usas ACR)
docker tag siniestros-api:latest turegistry.azurecr.io/siniestros-api:latest

# Push
docker push turegistry.azurecr.io/siniestros-api:latest

# Actualizar Container Instance
az container restart --name siniestros-api --resource-group tu-resource-group
```

---

### Paso 6: Redeploy Frontend en Vercel

```powershell
# Hacer commit de cambios (si los hay)
git add .
git commit -m "Actualizar API URL a Azure Front Door HTTPS"
git push

# O trigger manual deploy en Vercel Dashboard
```

---

### Paso 7: Verificar

1. **Abrir tu app en Vercel**: `https://siniestros-api.vercel.app`
2. **Abrir DevTools** (F12)
3. **Tab Network**
4. **Hacer login o cualquier petición**
5. **Verificar**:
   - ✅ Request URL debe ser `https://siniestros-api-xxxxx.azurefd.net/...`
   - ✅ Status Code: `200 OK`
   - ✅ No errores de CORS
   - ✅ No errores de Mixed Content

---

## 🎯 Comandos PowerShell Completos (Alternativa CLI)

Si prefieres hacerlo por comandos:

```powershell
# 1. Crear Front Door Profile
az afd profile create `
  --resource-group tu-resource-group `
  --profile-name siniestros-frontdoor `
  --sku Standard_AzureFrontDoor

# 2. Crear Endpoint
az afd endpoint create `
  --resource-group tu-resource-group `
  --profile-name siniestros-frontdoor `
  --endpoint-name siniestros-api `
  --enabled-state Enabled

# 3. Crear Origin Group
az afd origin-group create `
  --resource-group tu-resource-group `
  --profile-name siniestros-frontdoor `
  --origin-group-name default-origin-group `
  --probe-request-type GET `
  --probe-protocol Http `
  --probe-interval-in-seconds 120 `
  --probe-path / `
  --sample-size 4 `
  --successful-samples-required 3 `
  --additional-latency-in-milliseconds 50

# 4. Crear Origin
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
  --https-port 443 `
  --enabled-state Enabled

# 5. Crear Route
az afd route create `
  --resource-group tu-resource-group `
  --profile-name siniestros-frontdoor `
  --endpoint-name siniestros-api `
  --route-name default-route `
  --origin-group default-origin-group `
  --supported-protocols Http Https `
  --https-redirect Enabled `
  --forwarding-protocol HttpOnly `
  --patterns-to-match "/*"

# 6. Obtener el endpoint URL
az afd endpoint show `
  --resource-group tu-resource-group `
  --profile-name siniestros-frontdoor `
  --endpoint-name siniestros-api `
  --query hostName `
  --output tsv
```

---

## 💰 Costos Estimados

**Azure Front Door Standard:**
- $0.04 USD por hora (~$30/mes)
- Primeros 10GB de transferencia incluidos
- $0.10 USD por GB adicional

**Total estimado:** $30-50 USD/mes

---

## 🐛 Troubleshooting

### Error: "Origin not responding"
```powershell
# Verificar que tu ACI esté corriendo
az container show --name siniestros-api --resource-group tu-resource-group --query "containers[0].instanceView.currentState"
```

### Error: "CORS policy"
- Verifica que agregaste el nuevo origen en `main.py`
- Redeploy el backend en Azure

### Error: "Mixed Content"
- Verifica que estás usando `https://` en `NEXT_PUBLIC_API_URL`
- Verifica que Front Door esté configurado con HTTPS

---

## ✅ Checklist Final

- [ ] Azure Front Door creado y funcionando
- [ ] CORS actualizado en `main.py`
- [ ] Backend redeployado en Azure
- [ ] `NEXT_PUBLIC_API_URL` actualizado en Vercel
- [ ] Frontend redeployado en Vercel
- [ ] Testing en producción exitoso
- [ ] No errores de Mixed Content
- [ ] No errores de CORS

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas, verifica:
1. Logs de Azure Container Instance
2. Logs de Azure Front Door
3. Network tab en DevTools del navegador
4. Variables de entorno en Vercel

