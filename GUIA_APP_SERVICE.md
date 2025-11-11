# 🚀 Desplegar FastAPI en Azure App Service con HTTPS

## ✅ Ventajas de Azure App Service
- ✅ HTTPS automático (certificado SSL gratis)
- ✅ Puede conectarse a la base de datos de otra cuenta
- ✅ Escalado automático
- ✅ Más barato que Front Door (~$13-55/mes según plan)
- ✅ URL personalizada: `https://tu-app.azurewebsites.net`

---

## 📋 Requisitos Previos

1. **Cuenta Azure personal** (sin restricciones de estudiante)
2. **Azure CLI** instalado y configurado
3. **Base de datos MySQL** en cuenta estudiantil (ya la tienes)
4. **Conexión configurada** para permitir acceso desde otra cuenta

---

## 🔧 Paso 1: Configurar Base de Datos para Acceso Externo

### En tu cuenta estudiantil (donde está la BD):

```powershell
# Permitir acceso desde todas las IPs de Azure
az mysql server firewall-rule create `
  --resource-group Rg-SCISP `
  --server-name scisp `
  --name AllowAllAzureIPs `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

⚠️ **Importante**: Esto permite que cualquier servicio de Azure acceda. Para más seguridad, después puedes restringir solo a la IP del App Service.

---

## 🚀 Paso 2: Preparar tu Aplicación

### 2.1. Crear `requirements.txt` (si no existe):

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
SQLAlchemy==2.0.36
pydantic==2.9.2
pymysql==1.1.1
cryptography
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
gunicorn==21.2.0
```

### 2.2. Crear `startup.sh`:

```bash
#!/bin/bash
# Iniciar Gunicorn con Uvicorn workers
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --timeout 600
```

Hacer ejecutable:
```powershell
# En Linux/Mac
chmod +x startup.sh
```

### 2.3. Crear archivo `.deployment`:

```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### 2.4. Verificar `main.py` - Actualizar CORS:

Tu archivo `main.py` debe tener:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://siniestros-api.vercel.app",
        "https://*.vercel.app",
        "https://*.azurewebsites.net",  # ← Agregar esto
        "http://localhost:3000",
        "*"  # Temporal
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
```

---

## 🎯 Paso 3: Crear App Service

### Opción A: Usando Azure Portal (Más fácil)

1. **Login a tu cuenta personal**: https://portal.azure.com
2. **Buscar "App Services"** → **+ Create**
3. **Configuración básica**:
   - Subscription: Tu cuenta personal
   - Resource Group: Crear nuevo `Rg-SiniestrosAPI`
   - Name: `siniestros-api` (será `siniestros-api.azurewebsites.net`)
   - Publish: **Code**
   - Runtime stack: **Python 3.11**
   - Operating System: **Linux**
   - Region: **West US 2** (mismo que tu BD para mejor latencia)
   
4. **Pricing Plan**:
   - Opción económica: **Basic B1** (~$13/mes)
   - Opción media: **Standard S1** (~$55/mes)
   - Para testing: **Free F1** (limitado pero funciona)

5. **Deployment**:
   - Enable GitHub Actions: **No** (lo haremos manual)

6. **Review + Create**

### Opción B: Usando Azure CLI (Automatizado) ⭐ RECOMENDADO

Ejecuta el script `CREAR_APP_SERVICE.ps1` que crearé a continuación.

---

## 🔐 Paso 4: Configurar Variables de Entorno

En el Portal de Azure o por CLI:

```powershell
# Nombre de tu App Service
$appName = "siniestros-api"
$resourceGroup = "Rg-SiniestrosAPI"

# Configurar variables de entorno
az webapp config appsettings set `
  --name $appName `
  --resource-group $resourceGroup `
  --settings `
    DATABASE_URL="mysql+pymysql://perilla:1016110530Np.@scisp.mysql.database.azure.com:3306/siniestros_scisp?charset=utf8mb4&ssl_ca=&ssl_verify_cert=true" `
    PYTHON_VERSION="3.11" `
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
    WEBSITES_PORT="8000"
```

---

## 📦 Paso 5: Desplegar tu Aplicación

### Método 1: Despliegue ZIP (Más rápido)

```powershell
# 1. Crear archivo ZIP con tu código
Compress-Archive -Path main.py, requirements.txt, startup.sh, boletin_generator.py, app/, Boletin/ -DestinationPath deploy.zip -Force

# 2. Desplegar
az webapp deployment source config-zip `
  --name siniestros-api `
  --resource-group Rg-SiniestrosAPI `
  --src deploy.zip
```

### Método 2: Desde Git (Recomendado para producción)

```powershell
# Configurar despliegue desde GitHub
az webapp deployment source config `
  --name siniestros-api `
  --resource-group Rg-SiniestrosAPI `
  --repo-url https://github.com/Loth-Lorien/EntregaSiniestros `
  --branch main `
  --manual-integration
```

### Método 3: Usando VS Code (Más fácil)

1. Instalar extensión **Azure App Service** en VS Code
2. Click en icono de Azure en la barra lateral
3. Sign in con tu cuenta personal
4. Right-click en tu App Service → **Deploy to Web App**
5. Seleccionar carpeta del proyecto

---

## 🔍 Paso 6: Verificar Despliegue

### 6.1. Ver logs:

```powershell
az webapp log tail `
  --name siniestros-api `
  --resource-group Rg-SiniestrosAPI
```

### 6.2. Probar API:

```powershell
# Verificar endpoint raíz
curl https://siniestros-api.azurewebsites.net/

# Verificar endpoint con datos
curl https://siniestros-api.azurewebsites.net/sucursales
```

---

## 🌐 Paso 7: Actualizar Frontend en Vercel

1. **Ir a Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Actualizar `NEXT_PUBLIC_API_URL`**:
   ```
   https://siniestros-api.azurewebsites.net
   ```
4. **Redeploy** frontend

---

## 🔒 Paso 8: Seguridad (Opcional pero Recomendado)

### Restringir acceso a la base de datos solo desde App Service:

```powershell
# 1. Obtener IP saliente de tu App Service
$outboundIPs = az webapp show `
  --name siniestros-api `
  --resource-group Rg-SiniestrosAPI `
  --query outboundIpAddresses `
  --output tsv

# 2. Agregar regla de firewall en MySQL (cuenta estudiantil)
# Separar IPs y crear regla para cada una
$ips = $outboundIPs -split ','
$counter = 1
foreach ($ip in $ips) {
    az mysql server firewall-rule create `
      --resource-group Rg-SCISP `
      --server-name scisp `
      --name "AllowAppService$counter" `
      --start-ip-address $ip.Trim() `
      --end-ip-address $ip.Trim()
    $counter++
}

# 3. Eliminar regla permisiva (opcional)
az mysql server firewall-rule delete `
  --resource-group Rg-SCISP `
  --server-name scisp `
  --name AllowAllAzureIPs
```

---

## 🎯 Paso 9: Configurar Dominio Personalizado (Opcional)

Si tienes un dominio:

```powershell
# Agregar dominio personalizado
az webapp config hostname add `
  --webapp-name siniestros-api `
  --resource-group Rg-SiniestrosAPI `
  --hostname api.tudominio.com

# Habilitar HTTPS
az webapp update `
  --name siniestros-api `
  --resource-group Rg-SiniestrosAPI `
  --set httpsOnly=true
```

---

## 💰 Costos Estimados

| Plan | Precio/mes | Características |
|------|------------|-----------------|
| **Free F1** | $0 | 60 min CPU/día, 1GB RAM, 1GB storage |
| **Basic B1** | ~$13 | 100 ACU, 1.75GB RAM, 10GB storage |
| **Standard S1** | ~$55 | 100 ACU, 1.75GB RAM, 50GB storage, Auto-scale |

**Recomendación**: Empieza con **Basic B1** para producción ligera.

---

## 🐛 Troubleshooting

### Error: "Application Error"
```powershell
# Ver logs detallados
az webapp log tail --name siniestros-api --resource-group Rg-SiniestrosAPI
```

### Error: "Can't connect to MySQL"
- Verifica que las reglas de firewall permitan la IP del App Service
- Verifica que DATABASE_URL esté correctamente configurado

### Error: "Module not found"
- Verifica que `requirements.txt` tenga todas las dependencias
- Verifica que SCM_DO_BUILD_DURING_DEPLOYMENT=true

---

## ✅ Checklist Final

- [ ] Base de datos permite acceso desde Azure
- [ ] App Service creado en cuenta personal
- [ ] Variables de entorno configuradas
- [ ] Código desplegado
- [ ] API responde en `https://tu-app.azurewebsites.net`
- [ ] CORS configurado para incluir `*.azurewebsites.net`
- [ ] Frontend actualizado con nueva URL
- [ ] Testing completo desde Vercel
- [ ] Firewall de MySQL restringido (seguridad)

---

## 📞 Próximos Pasos

1. Ejecutar `CREAR_APP_SERVICE.ps1` para crear todo automáticamente
2. O seguir los pasos manualmente en el portal
3. Actualizar `NEXT_PUBLIC_API_URL` en Vercel
4. ¡Disfrutar de tu API con HTTPS! 🎉
