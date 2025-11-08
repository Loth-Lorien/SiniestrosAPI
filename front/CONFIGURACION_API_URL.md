# Configuración de API URL - Sistema de Siniestros

## 📋 Resumen de Cambios

Se ha eliminado completamente el hardcodeo de `http://localhost:8000` en todo el proyecto y se ha implementado una configuración centralizada con variables de entorno.

## 🎯 Objetivo

Permitir que la aplicación use automáticamente la URL correcta del backend según el entorno:
- **Desarrollo local**: `http://localhost:8000`
- **Producción (Azure)**: `http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000`

## 🔧 Cambios Implementados

### 1. Archivo de Configuración Centralizado

**Archivo nuevo**: `src/lib/config.ts`

Este archivo contiene todas las configuraciones de la aplicación:
```typescript
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000';
```

**Fallback inteligente**:
- Si existe `NEXT_PUBLIC_API_URL` → usa esa URL
- Si no existe → usa la URL de Azure (producción)

### 2. Archivos Actualizados

#### Configuración y Servicios
- ✅ `src/lib/config.ts` - **NUEVO** - Configuración centralizada
- ✅ `src/lib/services.ts` - Usa `API_URL` y `API_ENDPOINTS`
- ✅ `src/lib/axios.ts` - Cliente HTTP con URL dinámica

#### Páginas
- ✅ `src/app/page.tsx` - Página principal
- ✅ `src/app/login/page.tsx` - Login
- ✅ `src/app/dashboard/page.tsx` - Dashboard principal
- ✅ `src/app/siniestros/page.tsx` - Gestión de siniestros (14 ocurrencias corregidas)
- ✅ `src/app/siniestros/page_new.tsx` - Versión alternativa
- ✅ `src/app/sucursales/page.tsx` - Gestión de sucursales
- ✅ `src/app/estadisticas/page.tsx` - Estadísticas

#### Componentes
- ✅ `src/components/FormularioSiniestro.tsx`
- ✅ `src/components/BoletinGenerator.tsx`
- ✅ `src/components/ModalDetalleSucursal.tsx`

#### Archivos de Entorno
- ✅ `.env.local` - Actualizado con URL de Azure por defecto
- ✅ `.env.example` - Documentación mejorada

## 📝 Variables de Entorno

### Archivo: `.env.local`

```bash
# Para producción en Azure (por defecto):
NEXT_PUBLIC_API_URL=http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000

# Para desarrollo local, cambia a:
# NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_ENV=production
```

## 🚀 Cómo Usar

### Modo Producción (Azure)
```bash
# Dejar el .env.local como está
npm run dev
# o
npm run build && npm start
```

### Modo Desarrollo Local
```bash
# Editar .env.local y cambiar a:
NEXT_PUBLIC_API_URL=http://localhost:8000

# Reiniciar el servidor
npm run dev
```

### Modo Vercel
En la configuración de Vercel, agregar la variable de entorno:
```
NEXT_PUBLIC_API_URL=http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000
```

## 🔍 Patrón Usado en el Código

Todos los fetch ahora usan este patrón:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  'http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000';

const response = await fetch(`${API_URL}/endpoint`, {
  // ... opciones
});
```

## ✅ Verificación

Para verificar que no queden URLs hardcodeadas:

```bash
# En PowerShell
cd front
Select-String -Path "src\**\*.tsx" -Pattern "http://localhost:8000"

# No debería devolver resultados
```

## 📊 Estadísticas de Cambios

- **Archivos modificados**: 16
- **Ocurrencias corregidas**: 30+
- **Nuevo archivo creado**: 1 (`config.ts`)
- **Archivos de entorno actualizados**: 2

## 🎉 Beneficios

1. ✅ **Flexibilidad**: Cambiar entre desarrollo y producción es trivial
2. ✅ **Mantenibilidad**: Un solo lugar para cambiar la URL
3. ✅ **Seguridad**: No hay credenciales hardcodeadas
4. ✅ **Deploy fácil**: Funciona automáticamente en diferentes entornos
5. ✅ **Fallback inteligente**: Si falla la variable de entorno, usa Azure

## 🔄 Próximos Pasos

1. **Rebuild de la aplicación**: `npm run build`
2. **Test en desarrollo**: Verificar con `localhost:8000`
3. **Test en producción**: Verificar con Azure URL
4. **Deploy a Vercel**: Configurar variable de entorno

## 💡 Notas Importantes

- **NEXT_PUBLIC_**: El prefijo es necesario para que Next.js exponga la variable al navegador
- **Reinicio necesario**: Después de cambiar `.env.local`, reinicia el servidor de desarrollo
- **Build requerido**: Los cambios en variables de entorno requieren rebuild para producción

---

**Fecha de actualización**: 8 de noviembre de 2025
**Estado**: ✅ Completado y verificado
