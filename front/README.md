# Frontend Sistema de Gestión de Siniestros

Dashboard y frontend desarrollado con Next.js para la gestión y análisis de siniestros.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15.5.4 con App Router
- **Frontend**: React 19 + TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: useState local (sin estado global)
- **HTTP**: Axios configurado
- **Iconos**: React Icons (Feather Icons)

## 📋 Características

### ✅ Implementado
- 🎨 **Dashboard Principal** - Vista general con estadísticas
- 📊 **Estadísticas Generales** - KPIs principales del sistema
- 📈 **Estadísticas por Tipo** - Análisis de siniestros por categoría
- 🎯 **Layout Responsivo** - Diseño adaptativo con Tailwind CSS
- 🔧 **Configuración API** - Cliente Axios con autenticación
- 📱 **Componentes Reutilizables** - StatsCard, Layout, etc.
- 🔗 **Custom Hooks** - Manejo de estado para estadísticas

### 🚧 En Desarrollo
- 📋 **Gestión de Siniestros** - CRUD completo
- 📊 **Reportes Avanzados** - Gráficos y análisis detallados
- 👥 **Gestión de Usuarios** - Administración de accesos
- 🔍 **Filtros Avanzados** - Búsquedas por criterios múltiples

## 🛠️ Instalación y Configuración

### Prerequisitos
- Node.js 18+ instalado
- API de Siniestros ejecutándose

### Pasos de Instalación

1. **Instalar dependencias**

```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_ENV=development
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🏗️ Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio (Dashboard)
├── components/            # Componentes reutilizables
│   ├── DashboardLayout.tsx
│   ├── StatsCard.tsx
│   └── EstadisticasPorTipo.tsx
├── hooks/                 # Custom hooks
│   ├── useEstadisticasGenerales.ts
│   ├── useEstadisticasPorTipo.ts
│   └── useDatosMaestros.ts
├── lib/                   # Configuración y servicios
│   ├── api.ts            # Cliente Axios configurado
│   └── services.ts       # Servicios de API
└── types/                # Definiciones TypeScript
    └── index.ts          # Tipos de la API
```

## 🔌 Conexión con la API

El frontend se conecta automáticamente con la API de Siniestros. La configuración incluye:

- **Autenticación HTTP Basic** automática
- **Interceptors** para manejo de errores
- **Timeout** configurado (10 segundos)
- **Tipado completo** con TypeScript

### Endpoints Utilizados
- `GET /estadisticas/generales` - Estadísticas principales
- `GET /estadisticas/por-tipo` - Análisis por tipo de siniestro
- `GET /tiposiniestro` - Catálogos de tipos
- `GET /sucursales` - Información de sucursales

## 🎨 Componentes Principales

### DashboardLayout
Layout principal con sidebar de navegación y header.

### StatsCard
Tarjeta reutilizable para mostrar estadísticas con:
- Formateo automático de números/moneda
- Estados de carga
- Indicadores de tendencia
- Iconos personalizables

### EstadisticasPorTipo
Componente que muestra estadísticas agrupadas por tipo de siniestro con barras de progreso animadas.

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Verificación de ESLint
```

## 🚀 Desarrollo

### Agregar Nuevas Páginas
1. Crear archivo en `src/app/nueva-pagina/page.tsx`
2. Usar el layout con `<DashboardLayout>`

### Crear Nuevos Servicios
1. Agregar función en `src/lib/services.ts`
2. Definir tipos en `src/types/index.ts`
3. Crear hook personalizado en `src/hooks/`

## 📱 Responsividad

El diseño es completamente responsivo con breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🐛 Debugging

Para debug de la API:
1. Verificar que la API esté ejecutándose en `http://localhost:8000`
2. Revisar la consola del navegador para errores
3. Verificar la pestaña Network en DevTools

## 📄 Licencia

Proyecto de demostración para gestión de siniestros.
