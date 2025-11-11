# 🔧 Solución: Vercel Bloqueando Peticiones a Azure API

## 🐛 Problema Detectado

Tu aplicación de Vercel `https://siniestros-api.vercel.app/` está siendo **bloqueada** al intentar consumir tu API en Azure.

### Detalles del Error:

```
Request URL: http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/usuarios
Referer: https://siniestros-api.vercel.app/
Status: CORS Error / Mixed Content Block
```

## ⚠️ Causa Raíz: Mixed Content (HTTPS → HTTP)

El problema tiene **2 causas principales**:

### 1. **Mixed Content Security**
- ❌ **Vercel usa HTTPS**: `https://siniestros-api.vercel.app/`
- ❌ **Tu API usa HTTP**: `http://...azurecontainer.io:8000`
- 🚫 **Los navegadores BLOQUEAN peticiones de HTTPS a HTTP por seguridad**

### 2. **CORS no configurado correctamente**
- La API necesita permitir explícitamente el origen de Vercel
- Los headers de autorización necesitan estar en la whitelist

## ✅ Solución Implementada

### Cambio 1: CORS Actualizado en `main.py`

```python
# ANTES (bloqueaba Vercel):
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|...",
    # ...
)

# DESPUÉS (permite Vercel):
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://siniestros-api.vercel.app",  # ✅ Tu app específica
        "https://*.vercel.app",                # ✅ Otros deploys
        "http://localhost:3000",               # ✅ Local
        "*"                                     # 🔓 Permite todos (temporal)
    ],
    allow_credentials=True,              # ✅ Basic Auth
    allow_methods=["*"],                 # ✅ GET, POST, PUT, DELETE
    allow_headers=["*"],                 # ✅ Authorization, Content-Type
    expose_headers=["*"],
    max_age=3600,
)
```

## 🚀 Pasos para Aplicar la Solución

### 1. **Reiniciar la API en Azure**

```powershell
# Opción A: Rebuild y restart del contenedor
az acr build --registry scispregistry --image "siniestros-api:latest" .
az container restart --resource-group Rg-SCISP --name siniestros-api-container

# Opción B: Si estás corriendo localmente, reinicia:
# Ctrl+C para detener
# Luego ejecuta:
Invoke-Expression 'cd "C:\Users\MERZA\Desktop\clase\SiniestrosApi"; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000'
```

### 2. **Verificar que el CORS funciona**

Abre la consola del navegador en tu app de Vercel y revisa si las peticiones ahora pasan:

```javascript
// Deberías ver en Network tab:
// Status: 200 OK
// Access-Control-Allow-Origin: https://siniestros-api.vercel.app
```

### 3. **Probar desde Vercel**

Visita: `https://siniestros-api.vercel.app/login`

## ⚠️ Advertencia: Mixed Content

Aunque configuramos CORS, **el problema de Mixed Content (HTTPS→HTTP) persiste**.

### Soluciones a Largo Plazo:

#### **Opción 1: Agregar HTTPS a Azure Container Instance** (Recomendado)
- Usa **Azure Application Gateway** o **Azure Front Door**
- Esto te da un certificado SSL automático
- Costo: ~$25-50/mes

#### **Opción 2: Proxy en Vercel** (Gratis, pero más complejo)
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/:path*',
      },
    ]
  },
}
```

Luego en el frontend usar: `/api/usuarios` en lugar de la URL completa.

#### **Opción 3: Desplegar el Backend también en Vercel**
- Usa Vercel Serverless Functions
- Ventaja: Automáticamente tiene HTTPS
- Desventaja: Necesitas adaptar el código

## 🧪 Debugging

### Ver logs de CORS en Azure:

```powershell
az container logs --resource-group Rg-SCISP --name siniestros-api-container --follow
```

### Ver errores en el navegador:

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Busca errores como:
   ```
   Mixed Content: The page at 'https://...' was loaded over HTTPS,
   but requested an insecure resource 'http://...'. This request has been blocked
   ```

### Probar CORS manualmente:

```bash
# Desde PowerShell o Bash
curl -X OPTIONS http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/usuarios \
  -H "Origin: https://siniestros-api.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Deberías ver en la respuesta:
```
Access-Control-Allow-Origin: https://siniestros-api.vercel.app
Access-Control-Allow-Credentials: true
```

## 📊 Estado Actual

- ✅ CORS configurado en el backend
- ⚠️ Mixed Content aún puede causar problemas en algunos navegadores
- 🔄 Requiere reinicio del contenedor de Azure

## 🎯 Siguiente Paso Inmediato

```powershell
# 1. Commit de los cambios
cd C:\Users\MERZA\Desktop\clase\SiniestrosApi
git add main.py
git commit -m "fix: CORS configuration for Vercel deployment"
git push

# 2. Rebuild en Azure
az acr build --registry scispregistry --image "siniestros-api:latest" .
az container restart --resource-group Rg-SCISP --name siniestros-api-container

# 3. Verificar logs
az container logs --resource-group Rg-SCISP --name siniestros-api-container
```

## 💡 Notas Importantes

- **Chrome/Edge**: Puede bloquear Mixed Content incluso con CORS correcto
- **Firefox**: Más permisivo con Mixed Content
- **Safari**: Bloquea estrictamente Mixed Content
- **Solución definitiva**: Usar HTTPS en el backend (Azure Application Gateway)

---

**Fecha**: 8 de noviembre de 2025
**Estado**: ✅ CORS Configurado | ⚠️ Mixed Content pendiente
**Próximo paso**: Rebuild del contenedor en Azure
