# 🚨 Sistema de Gestión de Siniestros - Entrega Final

## 📋 Descripción del Proyecto

Sistema completo de gestión de siniestros desarrollado con **FastAPI** (backend) y **Next.js** (frontend), que permite el registro, seguimiento y análisis de incidentes de seguridad con integración de Power BI y generación automática de boletines.

## 🏗️ Arquitectura del Sistema

- **Backend**: FastAPI + SQLAlchemy + MySQL
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS
- **Autenticación**: HTTP Basic Auth con roles (Admin, Coordinador, Operador)
- **Base de Datos**: MySQL con relaciones estructuradas
- **Reportes**: Power BI embedido + Generación de PDFs/PNG

## 🚀 Características Principales

### 📊 Dashboard Interactivo
- Estadísticas en tiempo real
- Gráficos dinámicos por tipo de siniestro
- Resumen de actividad reciente
- Integración con Power BI

### 🔐 Sistema de Siniestros
- Registro completo de incidentes
- Gestión de implicados y pérdidas
- Carga de fotografías
- Generación automática de boletines

### 📈 Análisis y Reportes
- Estadísticas generales y por tipo
- Filtros por fecha y sucursal
- Exportación de datos
- Visualizaciones avanzadas

### 👥 Gestión de Usuarios y Sucursales
- Control de acceso por roles
- Gestión de sucursales
- Auditoría de actividades

## 🛠️ Instalación y Configuración

### Prerrequisitos
```bash
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- npm o yarn
```

### Backend (FastAPI)
```bash
# 1. Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 2. Instalar dependencias
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv passlib[bcrypt] python-multipart pillow cairosvg svglib reportlab selenium

# 3. Configurar base de datos
# Crear base de datos MySQL: 'siniestros'
# Ejecutar script SQL de inicialización

# 4. Iniciar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```bash
# 1. Ir al directorio frontend
cd front

# 2. Instalar dependencias
npm install

# 3. Iniciar desarrollo
npm run dev

# 4. Acceder a http://localhost:3000
```

## 📁 Estructura del Proyecto

```
SiniestrosApi/
├── 📁 app/                     # Módulos de la aplicación
│   ├── 📁 models/             # Modelos de datos
│   ├── 📁 routers/            # Endpoints API
│   ├── 📁 schemas/            # Esquemas Pydantic
│   └── 📁 services/           # Lógica de negocio
├── 📁 front/                   # Frontend Next.js
│   ├── 📁 src/
│   │   ├── 📁 app/            # Páginas de la aplicación
│   │   ├── 📁 components/     # Componentes React
│   │   ├── 📁 contexts/       # Contextos React
│   │   ├── 📁 hooks/          # Hooks personalizados
│   │   ├── 📁 lib/            # Utilidades
│   │   └── 📁 types/          # Tipos TypeScript
│   └── 📁 public/             # Archivos estáticos
├── 📁 Boletin/                # Plantillas SVG y recursos
├── 📁 uploads/                # Archivos cargados
├── 🐍 main.py                 # Servidor FastAPI principal
├── 🐍 boletin_generator.py    # Generador de boletines
├── 🗄️ actualizar_fecha_hora.sql
└── 📖 README.md
```

## 🔑 Credenciales por Defecto

```
Usuario: admin
Contraseña: admin123
Rol: Administrador
```

## 🌐 Endpoints Principales

### Autenticación
- `POST /auth/login` - Inicio de sesión
- `GET /auth/me` - Información del usuario actual

### Siniestros
- `GET /siniestros` - Listar siniestros
- `POST /siniestros` - Crear siniestro
- `GET /siniestros/{id}` - Detalle de siniestro
- `POST /siniestros/{id}/foto/subir` - Subir fotografía
- `POST /siniestros/{id}/boletin/generar` - Generar boletín

### Estadísticas
- `GET /estadisticas/generales` - Estadísticas generales
- `GET /estadisticas/por-tipo` - Estadísticas por tipo
- `GET /reportes/siniestros` - Reporte detallado

## 🎨 Características Técnicas

### Frontend
- **React 18** con Server Components
- **TypeScript** para tipado estático
- **Tailwind CSS** para estilos
- **Responsive Design** adaptable
- **Context API** para manejo de estado
- **Custom Hooks** para lógica reutilizable

### Backend
- **FastAPI** con documentación automática
- **SQLAlchemy ORM** con relaciones complejas
- **Pydantic** para validación de datos
- **Autenticación** con roles y permisos
- **Generación de PDFs** con SVG templates
- **Upload de archivos** con validación

### Base de Datos
- **Modelo relacional** normalizado
- **Índices optimizados** para consultas
- **Constraints** para integridad de datos
- **Triggers** para auditoría automática

## 🔧 Funcionalidades Avanzadas

### Generación de Boletines
- Plantillas SVG dinámicas por tipo de siniestro
- Inyección automática de datos
- Exportación a PDF y PNG
- Inclusión de fotografías en Base64

### Integración Power BI
- Dashboard embedido responsivo
- Actualización automática de datos
- Filtros interactivos avanzados

### Sistema de Roles
- **Administrador**: Acceso completo
- **Coordinador**: Gestión operativa
- **Operador**: Consulta y registro básico

## 📊 Métricas del Proyecto

- **Líneas de código**: ~5,000+
- **Componentes React**: 15+
- **Endpoints API**: 30+
- **Modelos de datos**: 10+
- **Páginas funcionales**: 8+

## 🎯 Casos de Uso

1. **Registro de Incidentes**: Captura completa de siniestros con detalles, implicados y pérdidas
2. **Seguimiento Operativo**: Monitoreo en tiempo real del estado de incidentes
3. **Análisis Gerencial**: Dashboards ejecutivos con KPIs y tendencias
4. **Reportería Automática**: Generación de boletines oficiales para autoridades
5. **Gestión Administrativa**: Control de usuarios, sucursales y configuraciones

## 🚀 Próximas Mejoras

- [ ] Notificaciones en tiempo real
- [ ] API móvil nativa
- [ ] Integración con sistemas externos
- [ ] Machine Learning para predicciones
- [ ] Geolocalización de incidentes

## 👨‍💻 Desarrollo

Este proyecto representa una solución completa para la gestión de siniestros con arquitectura moderna, buenas prácticas de desarrollo y enfoque en la experiencia del usuario.

---

**Desarrollado con 💙 para la gestión eficiente de seguridad empresarial**
