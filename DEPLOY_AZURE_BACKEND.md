# 🚀 Guía de Deployment Backend FastAPI en Azure

## 📋 Requisitos Previos

1. ✅ Cuenta de Azure activa
2. ✅ Azure DevOps account
3. ✅ Azure CLI instalado (opcional, para testing local)
4. ✅ Repositorio de Git con el código

## 🎯 Opción 1: Azure App Service (Recomendado)

### Paso 1: Crear Azure MySQL Database

1. Ve a Azure Portal: https://portal.azure.com
2. Busca "Azure Database for MySQL flexible server"
3. Click en "Create"
4. Configura:
   ```
   Resource Group: SiniestrosAPI-RG (nuevo)
   Server Name: siniestros-mysql-server
   Location: East US (o más cercano)
   Version: 8.0
   Compute + Storage: Burstable, B1ms (1 vCore, 2 GB RAM)
   Admin username: adminuser
   Admin password: [tu contraseña segura]
   ```
5. En "Networking":
   - ✅ Allow public access from any Azure service
   - ✅ Add your current client IP
6. Click "Review + Create" → "Create"

### Paso 2: Configurar la Base de Datos

```bash
# Conectarse a MySQL (usando MySQL Workbench o Azure Cloud Shell)
mysql -h siniestros-mysql-server.mysql.database.azure.com -u adminuser -p

# Crear la base de datos
CREATE DATABASE siniestros_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Ejecutar el script de creación de tablas
USE siniestros_db;
SOURCE crear_tabla_boletin.sql;
```

### Paso 3: Crear Azure App Service

1. En Azure Portal, busca "App Service"
2. Click en "Create"
3. Configura:
   ```
   Resource Group: SiniestrosAPI-RG (el mismo)
   Name: siniestros-api
   Publish: Code
   Runtime stack: Python 3.11
   Operating System: Linux
   Region: East US (mismo que la BD)
   Pricing Plan: Basic B1 (o Free F1 para pruebas)
   ```
4. Click "Review + Create" → "Create"

### Paso 4: Configurar Variables de Entorno en App Service

1. Ve a tu App Service → Configuration → Application settings
2. Agrega las siguientes variables:

```
DB_HOST=siniestros-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_USER=adminuser
DB_PASSWORD=[tu contraseña]
DB_NAME=siniestros_db
SECRET_KEY=[genera una clave secreta única]
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

3. Click "Save"

### Paso 5: Configurar Startup Command

1. En App Service → Configuration → General settings
2. En "Startup Command" agrega:
   ```
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
   ```
3. Click "Save"

### Paso 6: Deploy desde Azure DevOps

#### Opción A: Deploy Manual (Quick Start)

1. En tu App Service → Deployment Center
2. Selecciona "GitHub" como source
3. Autoriza y selecciona:
   - Organization: Loth-Lorien
   - Repository: SiniestrosAPI
   - Branch: main
4. Azure creará automáticamente un workflow

#### Opción B: Azure DevOps Pipeline (Avanzado)

1. Ve a Azure DevOps: https://dev.azure.com
2. Crea un nuevo proyecto: "SiniestrosAPI"
3. Ve a Repos → Import repository
   ```
   Clone URL: https://github.com/Loth-Lorien/SiniestrosAPI.git
   ```
4. Ve a Pipelines → Create Pipeline
5. Selecciona "Azure Repos Git"
6. Selecciona tu repositorio
7. Selecciona "Existing Azure Pipelines YAML file"
8. Selecciona `/azure-pipelines.yml`
9. En Variables, configura:
   ```
   azureServiceConnectionId: [crear service connection]
   webAppName: siniestros-api
   ```
10. Click "Run"

### Paso 7: Verificar el Deployment

1. Ve a: `https://siniestros-api.azurewebsites.net/`
2. Deberías ver:
   ```json
   {
     "mensaje": "API de Siniestros",
     "version": "1.0.0",
     "estado": "activo"
   }
   ```

3. Verifica endpoints:
   ```
   https://siniestros-api.azurewebsites.net/inicio
   https://siniestros-api.azurewebsites.net/sucursales
   https://siniestros-api.azurewebsites.net/siniestros
   ```

## 🎯 Opción 2: Azure Container Instances (Docker)

### Si prefieres usar Docker:

1. Crea un `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. Build y push a Azure Container Registry
3. Deploy desde Container Instances

## 🔒 Configuración de Seguridad

### 1. Configurar SSL/TLS
- Azure App Service incluye SSL automático en `*.azurewebsites.net`
- Para dominio custom, configura en App Service → Custom domains

### 2. Configurar CORS en main.py

Actualiza la URL de Azure en los origins:

```python
origins = [
    "http://localhost:3000",
    "https://your-vercel-app.vercel.app",
    "https://siniestros-api.azurewebsites.net"  # ← Agregar
]
```

### 3. Configurar MySQL Firewall

1. Ve a Azure MySQL → Networking
2. Agrega la IP de tu App Service
3. O permite "Allow access to Azure services"

## 📊 Monitoreo

### Application Insights (Recomendado)

1. En App Service → Application Insights → Enable
2. Esto te dará:
   - Logs en tiempo real
   - Performance metrics
   - Error tracking
   - Request analytics

### Logs en Tiempo Real

```bash
# Ver logs desde Azure CLI
az webapp log tail --name siniestros-api --resource-group SiniestrosAPI-RG
```

O desde Azure Portal:
- App Service → Log stream

## 🔄 Actualizar el Frontend

Una vez desplegado el backend, actualiza en Vercel:

1. Ve a Vercel → Settings → Environment Variables
2. Actualiza:
   ```
   NEXT_PUBLIC_API_URL=https://siniestros-api.azurewebsites.net
   ```
3. Redeploy el frontend

## 💰 Costos Estimados

### Configuración Básica:
- **App Service B1**: ~$13/mes
- **MySQL Flexible B1ms**: ~$15/mes
- **Total**: ~$28/mes

### Configuración Free (para pruebas):
- **App Service F1**: Gratis (con limitaciones)
- **MySQL**: No tiene tier gratis, mínimo ~$15/mes

### Alternativa de Bajo Costo:
Usa **Azure Database for MySQL Single Server** en tier Basic para ~$8/mes

## 🆘 Troubleshooting

### Error: "Application Error"
1. Verifica logs: App Service → Log stream
2. Verifica variables de entorno
3. Verifica startup command

### Error: "Can't connect to MySQL"
1. Verifica firewall rules en MySQL
2. Verifica connection string
3. Verifica credenciales en App Settings

### Error: "Module not found"
1. Verifica requirements.txt está completo
2. Redeploy la aplicación

## ✅ Checklist Final

- [ ] MySQL database creada y configurada
- [ ] Tablas creadas en la base de datos
- [ ] App Service creado
- [ ] Variables de entorno configuradas
- [ ] Startup command configurado
- [ ] Código desplegado
- [ ] API funcionando (verificar endpoints)
- [ ] CORS configurado correctamente
- [ ] Logs y monitoreo habilitado
- [ ] Frontend actualizado con nueva URL
- [ ] Tests de integración pasando

## 📞 URL Final

Tu API estará disponible en:
```
https://siniestros-api.azurewebsites.net
```

Y tu frontend en Vercel podrá consumirla usando esta URL.

---

**¡Tu backend está listo en Azure! 🎉**
