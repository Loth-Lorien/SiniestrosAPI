# 🐳 Deploy Backend FastAPI en Azure Container Instances (ACI)

## 💰 Ventajas de ACI vs App Service

| Característica | App Service | Container Instances |
|----------------|-------------|---------------------|
| **Costo mínimo** | ~$13/mes | ~$0.013/hora (~$10/mes)* |
| **Escalabilidad** | Automática | Manual |
| **Configuración** | Más compleja | Más simple |
| **Ideal para** | Producción | Desarrollo/Bajo tráfico |

*Con 1 vCore, 1.5GB RAM, running 24/7

## 📋 Requisitos Previos

1. ✅ Azure CLI instalado
2. ✅ Docker Desktop instalado y corriendo
3. ✅ Cuenta de Azure activa
4. ✅ MySQL Database ya creado (puedes usar el mismo de antes)

## 🚀 Opción 1: Deploy con Azure CLI (MÁS RÁPIDO)

### Paso 1: Instalar Azure CLI

```powershell
# Windows (si no lo tienes)
winget install Microsoft.AzureCLI

# Verificar instalación
az --version
```

### Paso 2: Login en Azure

```powershell
az login
```

### Paso 3: Configurar Variables

```powershell
# Variables básicas
$RESOURCE_GROUP="SiniestrosAPI-RG"
$LOCATION="eastus"
$ACR_NAME="siniestrosacr"  # Debe ser único globalmente
$CONTAINER_NAME="siniestros-api"
$IMAGE_NAME="siniestros-backend"
$DNS_NAME="siniestros-api"  # Debe ser único globalmente

# Variables de entorno para el contenedor
$DB_HOST="siniestros-mysql-server.mysql.database.azure.com"
$DB_USER="adminuser"
$DB_PASSWORD="TuPasswordSegura123!"
$DB_NAME="siniestros_db"
$SECRET_KEY="tu-secret-key-super-segura-cambiala-123"
```

### Paso 4: Crear Resource Group (si no existe)

```powershell
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### Paso 5: Crear Azure Container Registry (ACR)

```powershell
# Crear ACR
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic

# Habilitar admin user (para simplificar)
az acr update -n $ACR_NAME --admin-enabled true

# Obtener credenciales
az acr credential show --name $ACR_NAME
```

### Paso 6: Build y Push de la Imagen Docker

```powershell
# Login al ACR
az acr login --name $ACR_NAME

# Build y push en un solo comando (desde la carpeta del proyecto)
az acr build --registry $ACR_NAME --image "${IMAGE_NAME}:latest" .
```

### Paso 7: Deploy en Container Instances

```powershell
# Obtener servidor del ACR
$ACR_SERVER="${ACR_NAME}.azurecr.io"

# Obtener password del ACR
$ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Crear Container Instance
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
    ALGORITHM=HS256 `
    ACCESS_TOKEN_EXPIRE_MINUTES=30 `
  --secure-environment-variables `
    DB_PASSWORD=$DB_PASSWORD `
  --restart-policy Always
```

### Paso 8: Obtener URL y Verificar

```powershell
# Obtener FQDN (URL pública)
az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query ipAddress.fqdn -o tsv

# Ver logs
az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME

# Verificar estado
az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query instanceView.state
```

Tu API estará disponible en:
```
http://siniestros-api.eastus.azurecontainer.io:8000
```

⚠️ **Nota**: Por defecto ACI no tiene HTTPS. Para HTTPS necesitas usar Azure Application Gateway o un reverse proxy.

### Paso 9: Configurar CORS en main.py

Actualiza el archivo `main.py` con la URL del contenedor:

```python
origins = [
    "http://localhost:3000",
    "https://your-vercel-app.vercel.app",
    "http://siniestros-api.eastus.azurecontainer.io:8000"
]
```

## 🚀 Opción 2: Deploy con Docker Local + ACR

### Paso 1: Build Local

```powershell
# Desde la carpeta del proyecto
docker build -t siniestros-backend .

# Probar localmente
docker run -p 8000:8000 `
  -e DB_HOST=localhost `
  -e DB_USER=root `
  -e DB_PASSWORD=password `
  -e DB_NAME=siniestros_db `
  -e SECRET_KEY=test-key `
  siniestros-backend
```

### Paso 2: Tag y Push a ACR

```powershell
# Tag la imagen
docker tag siniestros-backend ${ACR_NAME}.azurecr.io/siniestros-backend:latest

# Login al ACR
az acr login --name $ACR_NAME

# Push
docker push ${ACR_NAME}.azurecr.io/siniestros-backend:latest
```

### Paso 3: Deploy (igual que Opción 1, Paso 7)

## 🔄 Actualizar el Contenedor

Cuando hagas cambios en el código:

```powershell
# 1. Rebuild y push nueva imagen
az acr build --registry $ACR_NAME --image "${IMAGE_NAME}:latest" .

# 2. Reiniciar el contenedor (forzar pull de nueva imagen)
az container restart --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME

# O eliminar y recrear
az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes
# Luego ejecutar de nuevo el comando de create del Paso 7
```

## 🔒 HTTPS con Azure Application Gateway (Opcional)

Si necesitas HTTPS:

### Opción A: Usar Azure Application Gateway (~$140/mes)
- Cara pero completa
- SSL/TLS terminación
- WAF incluido

### Opción B: Usar Cloudflare (GRATIS)
1. Dominio propio
2. Configurar Cloudflare DNS
3. SSL/TLS automático
4. Mucho más barato

### Opción C: Usar ngrok para desarrollo (GRATIS)
```powershell
ngrok http http://siniestros-api.eastus.azurecontainer.io:8000
```

## 📊 Monitoreo y Logs

```powershell
# Ver logs en tiempo real
az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --follow

# Ver métricas
az monitor metrics list --resource /subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/$CONTAINER_NAME --metric CPUUsage

# Ejecutar comando dentro del contenedor
az container exec --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --exec-command "/bin/bash"
```

## 🛑 Detener/Iniciar Contenedor

```powershell
# Detener (no se cobra mientras está detenido)
az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME

# Iniciar
az container start --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME

# Eliminar (para dejar de pagar)
az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes
```

## 💰 Costos Estimados

### Azure Container Registry (Basic)
- **$5/mes** (10 GB storage, 100 GB transfer)

### Container Instances (1 vCore, 1.5 GB RAM)
- **$0.0000125/vCore-second** = ~$32.40/mes si corre 24/7
- **$0.0000014/GB-second** = ~$3.63/mes por 1.5GB

**Subtotal ACI**: ~$36/mes

### MySQL Flexible Server B1ms
- **~$15/mes**

### **TOTAL ESTIMADO: ~$56/mes**

### 💡 Para Reducir Costos:

1. **Usa MySQL Single Server Basic** (~$8/mes en vez de $15)
2. **Reduce specs del contenedor** (0.5 vCore, 1 GB RAM = ~$18/mes)
3. **Detén el contenedor cuando no lo uses** (desarrollo)

**Costo mínimo posible: ~$31/mes** (ACR $5 + ACI $18 + MySQL $8)

## 🆘 Troubleshooting

### Error: "DNS name not available"
```powershell
# Prueba otro nombre
$DNS_NAME="siniestros-api-2024"
```

### Error: "Can't connect to MySQL"
```powershell
# Verificar firewall de MySQL
az mysql flexible-server firewall-rule create `
  --resource-group $RESOURCE_GROUP `
  --name siniestros-mysql-server `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

### Error: Container en "Waiting" state
```powershell
# Ver logs detallados
az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME
```

### Error: "Image pull failed"
```powershell
# Verificar que el admin user esté habilitado
az acr update -n $ACR_NAME --admin-enabled true

# Verificar credenciales
az acr credential show --name $ACR_NAME
```

## ✅ Checklist Final

- [ ] Azure CLI instalado y login exitoso
- [ ] Docker Desktop corriendo
- [ ] Resource Group creado
- [ ] Azure Container Registry creado
- [ ] Imagen Docker build y push exitoso
- [ ] MySQL database creado y accesible
- [ ] Container Instance desplegado
- [ ] Variables de entorno configuradas
- [ ] CORS actualizado en main.py
- [ ] API respondiendo correctamente
- [ ] Frontend actualizado con nueva URL

## 📞 URL Final

Tu API estará disponible en:
```
http://[dns-name].[location].azurecontainer.io:8000
```

Ejemplo:
```
http://siniestros-api.eastus.azurecontainer.io:8000
```

## 🔄 Actualizar Frontend en Vercel

```
NEXT_PUBLIC_API_URL=http://siniestros-api.eastus.azurecontainer.io:8000
```

---

**¡Tu backend en contenedor está listo! 🐳**
