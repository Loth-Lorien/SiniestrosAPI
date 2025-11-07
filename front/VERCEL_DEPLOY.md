# 🚀 Despliegue en Vercel - Guía Completa

## 📋 Preparación del Proyecto

Este proyecto Next.js está listo para ser desplegado en Vercel.

### Estructura del Proyecto
```
SiniestrosApi/
├── front/              ← Carpeta del frontend Next.js
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── vercel.json
└── main.py            ← Backend FastAPI (no se despliega en Vercel)
```

## ⚙️ Configuración en Vercel

### 1. Configuración Básica
- **Framework Preset**: `Next.js`
- **Root Directory**: `front`
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

### 2. Variables de Entorno
En el dashboard de Vercel → Settings → Environment Variables, agrega:

```
NEXT_PUBLIC_API_URL=https://tu-backend-url.com
```

**Importante**: Reemplaza `https://tu-backend-url.com` con la URL real de tu backend FastAPI.

### 3. Configuración de Git
- **Production Branch**: `main`
- **Repositorio**: Asegúrate de usar el repositorio correcto (SiniestrosAPI o EntregaSiniestros)

## 🛠️ Pasos para Desplegar

### Opción A: Desde GitHub (Recomendado)

1. **Conectar Repositorio**
   - Ve a https://vercel.com/new
   - Selecciona tu repositorio de GitHub
   - Haz clic en "Import"

2. **Configurar Proyecto**
   - Framework Preset: Selecciona "Next.js"
   - Root Directory: Escribe `front`
   - Build Settings: Dejar por defecto
   - Environment Variables: Agrega `NEXT_PUBLIC_API_URL`

3. **Deploy**
   - Haz clic en "Deploy"
   - Espera a que termine el build (2-3 minutos)

### Opción B: Desde Vercel CLI

```bash
# 1. Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# 2. Ir a la carpeta del frontend
cd front

# 3. Login en Vercel
vercel login

# 4. Deploy
vercel --prod
```

## 🔧 Solución de Problemas Comunes

### Error: "No Next.js version detected"
**Causa**: Vercel está buscando el `package.json` en la raíz del repositorio en lugar de la carpeta `front/`.

**Solución**: 
1. Ve a Settings → General
2. En "Root Directory", cambia de `.` a `front`
3. Guarda y redeploy

### Error: "Module not found: Can't resolve '../lib/services'"
**Causa**: La carpeta `src/lib/` no está en el repositorio o los imports están mal.

**Solución**: Ya está corregido en este commit. Asegúrate de hacer push de todos los archivos.

### Error: Build falla con errores de TypeScript
**Causa**: Hay errores de tipos en el código.

**Solución**: 
- Opción 1 (temporal): En `next.config.ts`, habilita `typescript: { ignoreBuildErrors: true }`
- Opción 2 (recomendada): Corrige los errores ejecutando `npm run build` localmente primero

### CORS Issues
**Causa**: El frontend en Vercel no puede comunicarse con tu backend.

**Solución**: En tu backend FastAPI (`main.py`), asegúrate de tener:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-app.vercel.app", "*"],  # Agrega tu dominio de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📦 Backend Deployment

**Nota**: Vercel solo despliega el frontend. Para el backend FastAPI, considera:

1. **Railway**: https://railway.app/ (Fácil, con plan gratuito)
2. **Render**: https://render.com/ (Plan gratuito disponible)
3. **PythonAnywhere**: https://www.pythonanywhere.com/ (Sencillo para Python)
4. **Heroku**: https://www.heroku.com/ (Requiere tarjeta de crédito)

### Ejemplo con Railway:
```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Desde la raíz del proyecto (donde está main.py)
railway init
railway up
```

## ✅ Checklist Final

Antes de desplegar, verifica:

- [ ] Todos los archivos están en GitHub (hiciste `git push`)
- [ ] La carpeta `front/src/lib/` existe y tiene `services.ts`
- [ ] Configuraste `Root Directory: front` en Vercel
- [ ] Agregaste la variable de entorno `NEXT_PUBLIC_API_URL`
- [ ] Tu backend está desplegado y funcionando
- [ ] Actualizaste el CORS en el backend con tu dominio de Vercel

## 🎯 URLs Importantes

Después del despliegue:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Dashboard**: `https://vercel.com/tu-usuario/tu-proyecto`
- **Logs**: Dashboard → Deployments → [tu deployment] → Build Logs

## 📞 Soporte

Si tienes problemas:
1. Revisa los Build Logs en Vercel
2. Verifica que tu backend esté funcionando
3. Revisa la consola del navegador (F12) para errores de CORS
4. Asegúrate de que `NEXT_PUBLIC_API_URL` esté configurada correctamente

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a la rama `main`, Vercel automáticamente:
1. Detecta los cambios
2. Inicia un nuevo build
3. Despliega la nueva versión
4. Actualiza la URL de producción

¡Tu aplicación está lista para producción! 🎉
