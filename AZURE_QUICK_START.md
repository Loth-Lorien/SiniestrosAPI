# 🚀 QUICK START: Backend en Azure

## ✅ Archivos Preparados

Tu proyecto ya tiene todo listo para Azure:
- ✅ `azure-pipelines.yml` - Pipeline de CI/CD
- ✅ `requirements.txt` - Dependencias Python
- ✅ `startup.sh` - Script de inicio
- ✅ `.env.example` - Plantilla de variables de entorno
- ✅ `DEPLOY_AZURE_BACKEND.md` - Guía completa

## 🎯 Opción Más Rápida: Azure App Service con GitHub

### 1️⃣ Crear MySQL Database (5 min)
```
Portal Azure → Azure Database for MySQL Flexible Server
- Nombre: siniestros-mysql-server
- Usuario: adminuser
- Versión: 8.0
- Tier: Burstable B1ms (~$15/mes)
- Red: Allow Azure services
```

### 2️⃣ Crear App Service (3 min)
```
Portal Azure → App Service
- Nombre: siniestros-api
- Runtime: Python 3.11
- OS: Linux
- Plan: Basic B1 (~$13/mes) o Free F1 (gratis)
```

### 3️⃣ Configurar Variables de Entorno (2 min)
```
App Service → Configuration → Application Settings

DB_HOST=siniestros-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_USER=adminuser
DB_PASSWORD=[tu_password]
DB_NAME=siniestros_db
SECRET_KEY=[genera_una_clave_única]
CORS_ORIGINS=https://tu-app.vercel.app,http://localhost:3000
```

### 4️⃣ Conectar GitHub (2 min)
```
App Service → Deployment Center
- Source: GitHub
- Repository: Loth-Lorien/SiniestrosAPI
- Branch: main
- Build provider: GitHub Actions (automático)
```

### 5️⃣ Configurar Startup Command (1 min)
```
App Service → Configuration → General Settings
Startup Command:
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

### 6️⃣ Crear Base de Datos (5 min)
```bash
# Conectar a MySQL
mysql -h siniestros-mysql-server.mysql.database.azure.com -u adminuser -p

# Crear BD y tablas
CREATE DATABASE siniestros_db;
USE siniestros_db;
SOURCE crear_tabla_boletin.sql;
```

## ✅ Verificación

Tu API estará en: `https://siniestros-api.azurewebsites.net`

Prueba:
```bash
curl https://siniestros-api.azurewebsites.net/
curl https://siniestros-api.azurewebsites.net/inicio
curl https://siniestros-api.azurewebsites.net/sucursales
```

## 🔄 Actualizar Frontend

En Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://siniestros-api.azurewebsites.net
```

Redeploy el frontend.

## 💰 Costo Total Estimado

- MySQL Flexible B1ms: ~$15/mes
- App Service Basic B1: ~$13/mes
- **Total: ~$28/mes**

O usa App Service Free F1 = **$15/mes total** (solo MySQL)

## 📞 Soporte

Ver guía completa en: `DEPLOY_AZURE_BACKEND.md`

---

**Tiempo total: ~20 minutos** ⏱️
