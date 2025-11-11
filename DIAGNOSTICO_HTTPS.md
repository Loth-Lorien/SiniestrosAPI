# 🚀 DIAGNÓSTICO: ¿Por qué no funciona el acceso HTTPS a mi API?

## 📊 Estado Actual

### ✅ Lo que SÍ tienes:
- **Azure Container Instance**: `siniestros-api-container` ✅ Running
- **IP Pública**: `20.51.82.175` ✅ Funciona
- **FQDN**: `siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io` ✅ Funciona
- **Protocolo**: HTTP (puerto 8000) ✅ Responde correctamente

### ❌ Lo que NO tienes:
- **Application Gateway** ❌ No existe
- **Azure Front Door** ❌ No existe  
- **HTTPS/SSL** ❌ No configurado

## 🔴 Problema Real

Tu Container Instance **solo usa HTTP** en el puerto 8000:

```
http://20.51.82.175:8000               ← ✅ Funciona
http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000  ← ✅ Funciona
https://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000 ← ❌ NO funciona (no hay SSL)
```

**Vercel requiere HTTPS**, por lo que el navegador bloquea las peticiones HTTP desde tu frontend HTTPS (Mixed Content Policy).

## 🎯 Solución

Necesitas crear un **Azure Front Door** o **Application Gateway** que:

1. Escucha en **HTTPS** (puerto 443)
2. Tiene un certificado SSL (automático en Azure)
3. Reenvía peticiones a tu Container Instance en **HTTP** (puerto 8000)

### Flujo deseado:
```
Frontend Vercel (HTTPS) 
    ↓ 
Azure Front Door (HTTPS) 
    ↓ 
Container Instance (HTTP)
```

## 📝 Pasos para Solucionarlo

### Opción 1: Usar el script PowerShell (Automático)

```powershell
# Ejecutar el script
.\CREAR_FRONTDOOR.ps1
```

Este script:
- ✅ Crea Azure Front Door automáticamente
- ✅ Configura HTTPS con certificado SSL automático
- ✅ Te da una URL HTTPS lista para usar

### Opción 2: Portal de Azure (Manual)

1. **Ir a Azure Portal**: https://portal.azure.com
2. **Buscar "Front Door and CDN profiles"**
3. **Click "+ Create"**
4. **Configurar**:
   - Resource Group: `Rg-SCISP`
   - Name: `siniestros-api-frontdoor`
   - Tier: **Standard**
   - Endpoint name: `siniestros-api`

5. **Agregar Origin**:
   - Origin type: **Custom**
   - Host name: `siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io`
   - Origin host header: `siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io`
   - Protocol: **HTTP only**
   - HTTP port: `8000`

6. **Configurar Route**:
   - Patterns: `/*`
   - Protocols: **HTTP and HTTPS**
   - HTTPS redirect: **Enabled**
   - Forwarding protocol: **HTTP only**

7. **Create**

## 🔍 Verificación

Después de crear Front Door, verifica:

```powershell
# Tu nueva URL HTTPS será algo como:
# https://siniestros-api-xxxxx.azurefd.net

# Verificar que funciona
curl https://siniestros-api-xxxxx.azurefd.net/
```

## 📋 Después de crear Front Door

1. **Actualizar variable en Vercel**:
   ```
   NEXT_PUBLIC_API_URL=https://siniestros-api-xxxxx.azurefd.net
   ```

2. **Actualizar CORS en main.py**:
   ```python
   allow_origins=[
       "https://siniestros-api.vercel.app",
       "https://siniestros-api-xxxxx.azurefd.net",  # ← Tu nuevo Front Door
       "https://*.vercel.app",
       "*"  # Temporal
   ]
   ```

3. **Redeploy backend**:
   ```powershell
   # Rebuild imagen
   docker build -t scispregistry.azurecr.io/siniestros-api:latest .
   docker push scispregistry.azurecr.io/siniestros-api:latest
   
   # Restart container
   az container restart --name siniestros-api-container --resource-group Rg-SCISP
   ```

4. **Redeploy frontend en Vercel**:
   - Push a GitHub o trigger manual deploy

## ⚠️ Importante

- **Container Instance NO soporta HTTPS directamente**
- **DEBES usar Front Door o Application Gateway** para HTTPS
- **Front Door es más rápido y fácil** de configurar
- **Costo estimado**: ~$30-50 USD/mes

## 🐛 Si sigues teniendo problemas

1. Verifica logs de Container Instance:
   ```powershell
   az container logs --name siniestros-api-container --resource-group Rg-SCISP
   ```

2. Verifica que Front Door esté "Running":
   ```powershell
   az afd endpoint show --resource-group Rg-SCISP --profile-name siniestros-api-frontdoor --endpoint-name siniestros-api
   ```

3. Verifica CORS en Network tab del navegador

---

## 📞 Resumen

**Tu problema**: Container Instance solo tiene HTTP, Vercel necesita HTTPS

**Tu solución**: Crear Azure Front Door para agregar HTTPS

**Tu próximo paso**: Ejecutar `.\CREAR_FRONTDOOR.ps1` o crear Front Door en el portal
