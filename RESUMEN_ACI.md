# 🎯 RESUMEN: Deploy Backend en Azure Container Instances

## ✅ Archivos Preparados para Docker/ACI

Tu proyecto ahora tiene soporte completo para Azure Container Instances:

### 📄 Archivos Creados:
1. **`Dockerfile`** - Definición de la imagen Docker
2. **`.dockerignore`** - Excluye archivos innecesarios del build
3. **`deploy-azure.ps1`** - Script automatizado de deployment ⭐
4. **`DEPLOY_AZURE_CONTAINER.md`** - Guía completa paso a paso
5. **`ACI_QUICK_START.md`** - Guía rápida (15 minutos)

## 🚀 Tres Formas de Desplegar:

### ⭐ Opción 1: Script Automatizado (RECOMENDADO)

La forma más fácil y rápida:

```powershell
# Ejecutar el script
.\deploy-azure.ps1
```

El script te pedirá:
- MySQL host, user, password
- Secret key (o genera una automáticamente)

Y hace todo automáticamente:
- ✅ Crea Resource Group
- ✅ Crea Azure Container Registry
- ✅ Build y push de la imagen Docker
- ✅ Deploy del contenedor
- ✅ Te da la URL pública
- ✅ Verifica que la API funcione

**Tiempo: ~10-15 minutos**

### 📋 Opción 2: Comandos Manuales (Step by Step)

Si prefieres control total, sigue: `ACI_QUICK_START.md`

**Tiempo: ~15 minutos**

### 📚 Opción 3: Guía Completa

Para entender cada paso en detalle: `DEPLOY_AZURE_CONTAINER.md`

**Tiempo: ~20 minutos**

## 💰 Costos de Azure Container Instances

### Configuración Propuesta:
- **Azure Container Registry (Basic)**: $5/mes
- **Container Instances** (1 vCore, 1.5 GB RAM, 24/7): ~$36/mes
- **MySQL Flexible Server B1ms**: ~$15/mes

**TOTAL: ~$56/mes**

### 💡 Reducir Costos:

#### Opción A: MySQL más barato (~$31/mes)
```
MySQL Single Server Basic: $8/mes
ACR: $5/mes
ACI (0.5 vCore, 1GB): $18/mes
Total: $31/mes
```

#### Opción B: Detener cuando no uses (Desarrollo)
```powershell
# Detener (no se cobra mientras está detenido)
az container stop --resource-group SiniestrosAPI-RG --name siniestros-api

# Iniciar cuando necesites
az container start --resource-group SiniestrosAPI-RG --name siniestros-api
```

#### Opción C: Usar base de datos gratuita
- **Supabase** (gratis hasta 500MB)
- **PlanetScale** (gratis hasta 5GB)
- **Clever Cloud** (gratis hasta 256MB)

Con BD gratuita: **Solo $41/mes** (ACR + ACI)

## 🆚 Comparación: App Service vs Container Instances

| Característica | App Service | Container Instances |
|----------------|-------------|---------------------|
| **Costo mínimo** | $13/mes (Basic B1) | $36/mes (1vCore, 1.5GB, 24/7) |
| | $0/mes (Free F1, limitado) | $18/mes (0.5vCore, 1GB, 24/7) |
| **Escalabilidad** | Automática | Manual |
| **SSL/HTTPS** | ✅ Incluido | ❌ Requiere config extra |
| **Custom Domain** | ✅ Fácil | ⚠️ Requiere App Gateway |
| **Deploy** | GitHub Actions | Docker + ACR |
| **Flexibilidad** | Limitada | ✅ Total control |
| **Ideal para** | Apps web tradicionales | Microservicios, APIs |

### Recomendación:
- **App Service**: Si necesitas HTTPS automático y dominio custom
- **Container Instances**: Si quieres control total y usar Docker

## 📝 Requisitos Previos

### 1. Instalar Azure CLI

```powershell
# Windows
winget install Microsoft.AzureCLI

# Verificar
az --version
```

### 2. Instalar Docker Desktop

Descarga desde: https://www.docker.com/products/docker-desktop

### 3. Tener MySQL en Azure

Si no tienes, crea uno:

```powershell
# MySQL Flexible Server (recomendado)
az mysql flexible-server create \
  --name siniestros-mysql \
  --resource-group SiniestrosAPI-RG \
  --location eastus \
  --admin-user adminuser \
  --admin-password TuPassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 8.0
```

## 🎯 Paso a Paso Rápido

### 1. Preparar el Proyecto

Ya está listo, todos los archivos están en tu repositorio.

### 2. Ejecutar el Script

```powershell
# Desde la carpeta del proyecto
.\deploy-azure.ps1
```

### 3. Esperar (10-15 minutos)

El script hará todo automáticamente.

### 4. Obtener la URL

Al final verás algo como:
```
📍 URL de tu API:
   http://siniestros-api-123.eastus.azurecontainer.io:8000
```

### 5. Actualizar Frontend

En Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=http://siniestros-api-123.eastus.azurecontainer.io:8000
```

Redeploy el frontend.

## 🔄 Actualizar el Backend

Cuando hagas cambios en el código:

```powershell
# Opción 1: Ejecutar el script de nuevo
.\deploy-azure.ps1

# Opción 2: Manual
az acr build --registry [ACR_NAME] --image "siniestros-backend:latest" .
az container restart --resource-group SiniestrosAPI-RG --name siniestros-api
```

## 📊 Monitoreo

### Ver logs en tiempo real:
```powershell
az container logs --resource-group SiniestrosAPI-RG --name siniestros-api --follow
```

### Ver estado:
```powershell
az container show --resource-group SiniestrosAPI-RG --name siniestros-api --query instanceView.state
```

### Ver métricas (CPU, Memoria):
Portal Azure → Container Instances → siniestros-api → Metrics

## ⚠️ Limitaciones de ACI

### No Incluye:
- ❌ HTTPS automático (HTTP solo)
- ❌ Custom domain fácil
- ❌ Auto-scaling
- ❌ Balanceo de carga automático

### Soluciones:
- **Para HTTPS**: Usa Cloudflare (gratis) o Azure App Gateway ($140/mes)
- **Para dominio**: Configura DNS + Cloudflare
- **Para scale**: Usa múltiples containers + Azure Front Door

## 🛑 Eliminar Todo (Dejar de Pagar)

```powershell
# Eliminar el contenedor
az container delete --resource-group SiniestrosAPI-RG --name siniestros-api --yes

# Eliminar el registry (opcional)
az acr delete --resource-group SiniestrosAPI-RG --name [ACR_NAME] --yes

# Eliminar todo el resource group (cuidado!)
az group delete --name SiniestrosAPI-RG --yes
```

## ✅ Checklist de Deployment

- [ ] Azure CLI instalado y login exitoso
- [ ] Docker Desktop instalado y corriendo
- [ ] MySQL database creado en Azure
- [ ] Credenciales de MySQL disponibles
- [ ] Script `deploy-azure.ps1` ejecutado
- [ ] URL pública obtenida
- [ ] API respondiendo correctamente
- [ ] CORS configurado con la URL
- [ ] Frontend actualizado en Vercel
- [ ] Tests de integración pasando

## 🆘 Problemas Comunes

### Error: "DNS name not available"
El nombre ya está en uso. El script genera nombres únicos, pero si falla, edita la variable `$DNS_NAME`.

### Error: "Can't connect to MySQL"
Verifica el firewall de MySQL:
```powershell
az mysql flexible-server firewall-rule create \
  --resource-group SiniestrosAPI-RG \
  --name siniestros-mysql \
  --rule-name AllowAzure \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Error: Container en estado "Waiting"
Ver logs:
```powershell
az container logs --resource-group SiniestrosAPI-RG --name siniestros-api
```

Probablemente es un error de conexión a MySQL o variable de entorno incorrecta.

## 📞 URLs Importantes

- **Azure Portal**: https://portal.azure.com
- **Container Instances**: https://portal.azure.com/#browse/Microsoft.ContainerInstance%2FcontainerGroups
- **Container Registry**: https://portal.azure.com/#browse/Microsoft.ContainerRegistry%2Fregistries

## 🎉 Resultado Final

Tu backend FastAPI estará corriendo en Azure en un contenedor Docker, accesible públicamente vía HTTP, conectado a MySQL, y listo para ser consumido por tu frontend en Vercel.

**¡Éxito con tu deployment! 🚀**

---

**Siguiente paso**: Ejecuta `.\deploy-azure.ps1` y en 15 minutos tendrás tu backend en la nube.
