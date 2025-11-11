# 🌐 Configuración de CORS - API Siniestros

## ✅ Cambios Realizados

### 1. Configuración CORS en `main.py`

Se ha configurado CORS para **permitir TODAS las conexiones** sin restricciones:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # ✅ Permite todos los orígenes
    allow_credentials=False,    # ⚠️ Debe ser False cuando origins=["*"]
    allow_methods=["*"],        # ✅ Permite todos los métodos HTTP
    allow_headers=["*"],        # ✅ Permite todos los headers
    expose_headers=["*"],       # ✅ Expone todos los headers
    max_age=3600,               # ⏱️ Cachea preflight por 1 hora
)
```

### 2. Por qué `allow_credentials=False`

**Importante:** Cuando `allow_origins=["*"]`, FastAPI/CORS requiere que `allow_credentials=False` por seguridad del navegador. Si necesitas cookies/credenciales, debes especificar orígenes explícitos.

---

## 🚀 Pasos para Actualizar el Contenedor en Azure

### Opción 1: Usar el Script Automatizado (Recomendado)

```powershell
# Ejecutar desde la raíz del proyecto
.\actualizar-cors-azure.ps1
```

### Opción 2: Comandos Manuales

```powershell
# 1. Verificar conexión
az account show

# 2. Reconstruir imagen
az acr build --registry scispregistry --image "siniestros-api:latest" .

# 3. Reiniciar contenedor
az container restart --resource-group Rg-SCISP --name siniestros-api-container

# 4. Ver logs
az container logs --resource-group Rg-SCISP --name siniestros-api-container --tail 50

# 5. Verificar estado
az container show --resource-group Rg-SCISP --name siniestros-api-container --query instanceView.state
```

---

## 🧪 Pruebas de Conectividad

### 1. Prueba desde el Navegador

Abre en el navegador:
```
http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/docs
```

### 2. Prueba con PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/inicio"

# Listar tipos de siniestro (público)
Invoke-RestMethod -Uri "http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/tiposiniestro"

# Listar usuarios (requiere autenticación)
$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("usuario:contraseña"))
}
Invoke-RestMethod -Uri "http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/usuarios" -Headers $headers
```

### 3. Prueba con cURL

```bash
# Health check
curl http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/inicio

# Con autenticación
curl -u usuario:contraseña http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/usuarios
```

### 4. Prueba desde el Frontend

Verifica que tu archivo `.env` o `.env.local` en el frontend tenga:

```env
NEXT_PUBLIC_API_URL=http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000
NEXT_PUBLIC_ENV=production
```

---

## 🔍 Verificación de Headers CORS

Para verificar que CORS está funcionando correctamente, verifica estos headers en la respuesta:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: *
```

### Verificar con DevTools del Navegador

1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Network**
3. Haz una petición desde tu frontend
4. Revisa los **Response Headers**

### Verificar con PowerShell

```powershell
$response = Invoke-WebRequest -Uri "http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/inicio" -Method Options
$response.Headers
```

---

## ❌ Solución de Problemas

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa:** El contenedor no se ha actualizado con la nueva configuración.

**Solución:**
1. Ejecuta `.\actualizar-cors-azure.ps1`
2. Espera 30 segundos para que el contenedor reinicie
3. Limpia la caché del navegador (Ctrl + Shift + R)

### Error: "Mixed Content" (HTTP vs HTTPS)

**Causa:** Tu frontend está en HTTPS pero la API en HTTP.

**Solución:**
- Si el frontend está en Vercel/HTTPS, considera usar HTTPS para la API también
- O despliega el frontend en HTTP para desarrollo

### Error 401: Unauthorized

**Causa:** Falta autenticación Basic Auth.

**Solución:**
```javascript
// En el frontend, configura axios con autenticación
const api = axios.create({
  baseURL: 'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000',
  auth: {
    username: 'tu_usuario',
    password: 'tu_contraseña'
  }
});
```

### El endpoint responde pero el navegador bloquea

**Causa:** El navegador aún tiene caché del preflight anterior.

**Solución:**
1. Limpia la caché del navegador
2. Prueba en modo incógnito
3. Espera a que expire el caché (max_age=3600 segundos = 1 hora)

---

## 📊 Monitoreo

### Ver logs en tiempo real

```powershell
az container logs --resource-group Rg-SCISP --name siniestros-api-container --follow
```

### Ver estado del contenedor

```powershell
az container show --resource-group Rg-SCISP --name siniestros-api-container --query instanceView
```

### Verificar conectividad

```powershell
Test-NetConnection -ComputerName siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io -Port 8000
```

---

## 🔒 Consideraciones de Seguridad

### ⚠️ Configuración Actual (Desarrollo/Testing)

- ✅ **Ventaja:** No hay restricciones, cualquier app puede conectarse
- ⚠️ **Desventaja:** No hay control sobre quién accede

### 🔐 Configuración Recomendada para Producción

Si necesitas mayor seguridad, especifica orígenes exactos:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu-frontend.vercel.app",
        "https://app.tudominio.com",
        "http://localhost:3000"  # Solo para desarrollo
    ],
    allow_credentials=True,  # Ahora sí puedes usar True
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
```

---

## ✅ Checklist de Verificación

Antes de dar por terminado, verifica:

- [ ] El código en `main.py` tiene la configuración de CORS actualizada
- [ ] La imagen Docker se reconstruyó exitosamente en Azure
- [ ] El contenedor se reinició correctamente
- [ ] El endpoint `/inicio` responde con status 200
- [ ] El frontend puede hacer peticiones sin errores de CORS
- [ ] Los headers CORS están presentes en las respuestas
- [ ] La autenticación Basic Auth funciona correctamente

---

## 📞 Soporte

Si después de seguir estos pasos sigues teniendo problemas:

1. Verifica los logs del contenedor
2. Revisa la consola del navegador (DevTools)
3. Prueba con Postman/Insomnia para aislar si es problema de CORS o de la API
4. Verifica que la URL de la API sea correcta en el frontend

---

## 📅 Última Actualización

**Fecha:** 8 de noviembre de 2025
**Cambios:** Configuración de CORS para permitir todas las conexiones
**Estado:** ✅ Listo para deployment
