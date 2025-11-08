# 🐳 QUICK START: Backend en Azure Container Instances

## ⚡ Setup Rápido (15 minutos)

### Requisitos
- Azure CLI instalado
- Docker Desktop corriendo
- MySQL ya creado en Azure

### 1️⃣ Login y Variables (2 min)

```powershell
# Login
az login

# Configurar variables (CAMBIA ESTOS VALORES)
$RESOURCE_GROUP="SiniestrosAPI-RG"
$LOCATION="eastus"
$ACR_NAME="siniestrosacr"
$CONTAINER_NAME="siniestros-api"
$IMAGE_NAME="siniestros-backend"
$DNS_NAME="siniestros-api"

# Tu MySQL info
$DB_HOST="tu-mysql-server.mysql.database.azure.com"
$DB_USER="adminuser"
$DB_PASSWORD="TuPassword123!"
$DB_NAME="siniestros_db"
$SECRET_KEY="genera-una-clave-secreta-unica-aqui"
```

### 2️⃣ Crear ACR y Build (5 min)

```powershell
# Crear Container Registry
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic
az acr update -n $ACR_NAME --admin-enabled true

# Build y push la imagen
az acr build --registry $ACR_NAME --image "${IMAGE_NAME}:latest" .
```

### 3️⃣ Deploy Container (3 min)

```powershell
# Obtener credenciales del ACR
$ACR_SERVER="${ACR_NAME}.azurecr.io"
$ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Crear el contenedor
az container create `
  --resource-group $RESOURCE_GROUP `
  --name $CONTAINER_NAME `
  --image "${ACR_SERVER}/${IMAGE_NAME}:latest" `
  --dns-name-label $DNS_NAME `
  --ports 8000 `
  --cpu 1 `
  --memory 1.5 `
  --registry-login-server $ACR_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --environment-variables `
    DB_HOST=$DB_HOST `
    DB_PORT=3306 `
    DB_USER=$DB_USER `
    DB_NAME=$DB_NAME `
    SECRET_KEY=$SECRET_KEY `
  --secure-environment-variables `
    DB_PASSWORD=$DB_PASSWORD `
  --restart-policy Always
```

### 4️⃣ Obtener URL (1 min)

```powershell
# Ver la URL pública
az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query ipAddress.fqdn -o tsv

# Ver logs
az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME
```

Tu API estará en: `http://[dns-name].[location].azurecontainer.io:8000`

### 5️⃣ Actualizar Frontend (1 min)

En Vercel → Environment Variables:
```
NEXT_PUBLIC_API_URL=http://siniestros-api.eastus.azurecontainer.io:8000
```

## 🔄 Actualizar Código

```powershell
# 1. Build nueva imagen
az acr build --registry $ACR_NAME --image "${IMAGE_NAME}:latest" .

# 2. Reiniciar contenedor
az container restart --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME
```

## 💰 Costos

- **ACR Basic**: $5/mes
- **Container (1 vCore, 1.5GB)**: ~$36/mes
- **MySQL B1ms**: ~$15/mes
- **Total**: ~$56/mes

## 🛑 Detener para Ahorrar

```powershell
# Detener (no se cobra)
az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME

# Iniciar cuando necesites
az container start --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME
```

## 📋 Comandos Útiles

```powershell
# Ver logs en vivo
az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --follow

# Ver estado
az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query instanceView.state

# Eliminar todo
az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes
```

## ✅ Verificar

```bash
# Probar endpoints
curl http://siniestros-api.eastus.azurecontainer.io:8000/
curl http://siniestros-api.eastus.azurecontainer.io:8000/inicio
curl http://siniestros-api.eastus.azurecontainer.io:8000/sucursales
```

---

**Tiempo total: ~15 minutos** ⏱️

Ver guía completa: `DEPLOY_AZURE_CONTAINER.md`
