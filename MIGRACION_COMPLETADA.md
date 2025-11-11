# 🎉 Migración Completada: Azure App Service con HTTPS

## ✅ Estado Actual

### Backend (API FastAPI)
- **Servicio**: Azure App Service
- **URL HTTPS**: `https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net`
- **Cuenta**: Suscripción de Azure 1 (cuenta personal)
- **Plan**: Basic B1
- **Estado**: ✅ Running
- **HTTPS**: ✅ Obligatorio (SSL automático)
- **Python**: 3.13
- **Ubicación**: Mexico Central

### Base de Datos
- **Servicio**: Azure MySQL Flexible Server
- **Servidor**: `scisp.mysql.database.azure.com`
- **Base de datos**: `siniestros_scisp`
- **Cuenta**: Azure for Students (cuenta estudiantil)
- **Estado**: ✅ Conectada y funcionando
- **Firewall**: Configurado para permitir servicios de Azure

### Frontend (Next.js)
- **Plataforma**: Vercel
- **URL**: `https://siniestros-api.vercel.app`
- **Estado**: ✅ Actualizado con nueva URL de API
- **Protocolo**: HTTPS → HTTPS ✅ (sin Mixed Content)

---

## 🔧 Configuración Aplicada

### 1. Variables de Entorno (Backend)

En Azure App Service (`Rg-SiniestrosPago`):
```bash
DATABASE_URL=mysql+pymysql://perilla:1016110530Np.@scisp.mysql.database.azure.com:3306/siniestros_scisp?charset=utf8mb4
PYTHON_VERSION=3.13
SCM_DO_BUILD_DURING_DEPLOYMENT=true
WEBSITES_PORT=8000
```

### 2. Variables de Entorno (Frontend)

**Local** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net
NEXT_PUBLIC_ENV=production
```

**Vercel** (Environment Variables):
```bash
NEXT_PUBLIC_API_URL=https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net
```

### 3. CORS Configurado (main.py)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://siniestros-api.vercel.app",
        "https://*.vercel.app",
        "https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net",
        "https://*.azurewebsites.net",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"  # Temporal
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
```

### 4. Firewall MySQL

Reglas configuradas en MySQL Flexible Server:
- `AllowAllAzureIPs`: Permite todos los servicios de Azure (0.0.0.0)

---

## 🚀 Arquitectura Final

```
┌─────────────────────────────────────────────────┐
│           Usuario (Navegador)                   │
│                   HTTPS                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│        Vercel (Frontend Next.js)                │
│   https://siniestros-api.vercel.app             │
│                   HTTPS                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│    Azure App Service (Backend FastAPI)         │
│   https://rg-siniestrospago-...net              │
│         Cuenta Personal                         │
│                   HTTPS                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│   Azure MySQL Flexible Server                  │
│   scisp.mysql.database.azure.com               │
│         Cuenta Estudiantil                      │
│              Puerto 3306                        │
└─────────────────────────────────────────────────┘
```

**Ventajas**:
- ✅ Todo el tráfico usa HTTPS (seguro)
- ✅ Sin problemas de Mixed Content
- ✅ SSL/TLS automático y gratuito
- ✅ Base de datos en cuenta estudiantil (sin costo)
- ✅ Backend en cuenta personal (más recursos)

---

## 📊 Costos Mensuales Estimados

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| **Azure App Service** | Basic B1 | ~$13 USD |
| **Azure MySQL** | Burstable B1ms | $0 (cuenta estudiantil) |
| **Vercel** | Hobby | $0 |
| **Total** | | **~$13 USD/mes** |

---

## 🔗 URLs Importantes

### Producción
- **Frontend**: https://siniestros-api.vercel.app
- **API**: https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net
- **Docs API**: https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net/docs
- **Health Check**: https://rg-siniestrospago-dpbxfecxaydyecdv.mexicocentral-01.azurewebsites.net/

### Desarrollo Local
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000

---

## 📝 Comandos Útiles

### Ver logs del App Service:
```powershell
az webapp log tail --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros
```

### Reiniciar App Service:
```powershell
az webapp restart --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros
```

### Redeploy código:
```powershell
# Crear ZIP
Compress-Archive -Path main.py, requirements.txt, boletin_generator.py, app, Boletin -DestinationPath deploy.zip -Force

# Desplegar
az webapp deployment source config-zip --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros --src deploy.zip

# Limpiar
Remove-Item deploy.zip -Force
```

### Ver configuración:
```powershell
# Variables de entorno
az webapp config appsettings list --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros --output table

# Información general
az webapp show --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros --output table
```

### Gestionar firewall MySQL (desde cuenta estudiantil):
```powershell
# Cambiar a cuenta estudiantil
az account set --subscription "Azure for Students"

# Listar reglas
az mysql flexible-server firewall-rule list --resource-group Rg-SCISP --name scisp --output table

# Crear regla
az mysql flexible-server firewall-rule create --resource-group Rg-SCISP --name scisp --rule-name NombreRegla --start-ip-address X.X.X.X --end-ip-address X.X.X.X
```

---

## 🐛 Troubleshooting

### La API no responde (503 Service Unavailable)
```powershell
# Ver logs
az webapp log tail --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros

# Verificar estado
az webapp show --name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros --query state
```

### Error de conexión a MySQL
1. Verificar firewall de MySQL
2. Verificar variable de entorno `DATABASE_URL`
3. Verificar que el servidor MySQL esté activo

### Error CORS desde Vercel
1. Verificar que la URL de Vercel esté en la lista de `allow_origins` en `main.py`
2. Redeploy backend después de actualizar CORS

### Frontend no ve la nueva URL
1. Verificar `.env.local` en el proyecto local
2. Verificar variables de entorno en Vercel Dashboard
3. Redeploy frontend en Vercel

---

## ✅ Checklist de Verificación

- [x] App Service creado y funcionando
- [x] HTTPS habilitado en App Service
- [x] Variables de entorno configuradas en backend
- [x] Firewall MySQL configurado
- [x] Código desplegado en App Service
- [x] API responde correctamente (endpoint `/`)
- [x] Base de datos conectada (endpoint `/sucursales`)
- [x] CORS actualizado en backend
- [x] `.env.local` actualizado en frontend local
- [x] `.env.example` actualizado
- [x] `config.ts` actualizado con fallback correcto
- [x] Variables de entorno actualizadas en Vercel
- [x] Frontend redeployado en Vercel
- [x] Testing completo desde Vercel

---

## 🎯 Próximos Pasos Opcionales

### 1. Dominio Personalizado
Si tienes un dominio, puedes configurarlo:
```powershell
az webapp config hostname add --webapp-name Rg-SiniestrosPago --resource-group Rg-ApiSiniestros --hostname api.tudominio.com
```

### 2. Escalar App Service
Para mejor rendimiento:
```powershell
az appservice plan update --name ASP-RgApiSiniestros-a42a --resource-group Rg-ApiSiniestros --sku S1
```

### 3. Monitoreo
Configurar Application Insights para logs y métricas avanzadas.

### 4. CI/CD Automático
Configurar GitHub Actions para despliegue automático al hacer push.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs con `az webapp log tail`
2. Verifica el estado del servicio en Azure Portal
3. Consulta la documentación en los archivos `.md` del proyecto

---

## 📚 Documentación Relacionada

- `GUIA_APP_SERVICE.md` - Guía completa de configuración
- `CONFIGURAR_FIREWALL_MYSQL.ps1` - Script de firewall
- `CREAR_APP_SERVICE.ps1` - Script de creación automática
- `CONFIGURACION_API_URL.md` - Documentación de refactor de URLs

---

**Última actualización**: 11 de noviembre de 2025
**Estado**: ✅ Producción
