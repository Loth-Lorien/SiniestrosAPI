# Sistema de Gestión de Siniestros

Un sistema completo de gestión y análisis de siniestros desarrollado con FastAPI (backend) y Next.js (frontend).

## 🚀 Características Principales

- **🔐 Sistema de Autenticación**: Login con usuarios y roles
- **📊 Dashboard Principal**: Vista general con estadísticas en tiempo real
- **📝 Gestión de Siniestros**: CRUD completo de siniestros con detalles e implicados
- **🏢 Gestión de Sucursales**: Administración de sucursales con estadísticas
- **📈 Estadísticas Detalladas**: Análisis por tipo, sucursal y estados
- **🎨 Interfaz Moderna**: UI responsive con Tailwind CSS

## 🛠️ Tecnologías Utilizadas

### Backend
- **FastAPI** - Framework web moderno para Python
- **SQLAlchemy** - ORM para base de datos
- **MySQL/SQLite** - Base de datos
- **Uvicorn** - Servidor ASGI
- **HTTP Basic Auth** - Autenticación

### Frontend
- **Next.js 15.5.4** - Framework de React
- **React 19** - Librería de UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Framework de CSS
- **Axios** - Cliente HTTP
- **React Icons** - Iconografía

## 📋 Requisitos Previos

- Python 3.8+
- Node.js 16+
- npm o yarn
- MySQL (opcional, usa SQLite por defecto)

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd SiniestrosApi
```

### 2. Configurar Backend
```bash
# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual (Windows)
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install fastapi uvicorn sqlalchemy pymysql python-multipart

# Ejecutar servidor
python -m uvicorn main:app --reload --port 8000
```

### 3. Configurar Frontend
```bash
# Navegar a la carpeta del frontend
cd front

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 🚀 Uso

1. **Backend**: Accede a `http://localhost:8000` para la API
   - Documentación automática: `http://localhost:8000/docs`

2. **Frontend**: Accede a `http://localhost:3001` para la interfaz web
   - Login con credenciales: `admin` / `admin123`

## 📁 Estructura del Proyecto

```
SiniestrosApi/
├── main.py                 # Aplicación principal FastAPI
├── requirements.txt        # Dependencias Python
├── .gitignore             # Archivos ignorados por Git
├── README.md              # Documentación
├── front/                 # Aplicación Next.js
│   ├── src/
│   │   ├── app/          # Páginas de la aplicación
│   │   ├── components/   # Componentes reutilizables
│   │   └── contexts/     # Contextos de React
│   ├── package.json      # Dependencias Node.js
│   └── tailwind.config.js # Configuración Tailwind
└── .venv/                # Entorno virtual Python
```

## 📊 Funcionalidades

### Dashboard Principal
- Estadísticas generales en tiempo real
- Métricas de siniestros (total, frustrados, consumados)
- Montos de pérdidas y recuperación
- Lista de siniestros recientes

### Gestión de Siniestros
- Listado completo con filtros dinámicos
- Vista detallada con información completa
- Estados: Frustrado/Consumado, Contemplar
- Información de sucursal y usuario

### Análisis por Sucursales
- Vista consolidada de todas las sucursales
- Estadísticas por sucursal
- Información de gerentes y contacto
- Métricas de recuperación

### Estadísticas Avanzadas
- Distribución por tipo de siniestro
- Análisis por estados (frustrados/consumados)
- Porcentajes de recuperación
- Visualización con barras de progreso

## 🔐 Sistema de Autenticación

El sistema utiliza HTTP Basic Authentication con los siguientes usuarios por defecto:

- **admin** / **admin123** (Administrador)
- **operador** / **operador123** (Operador)

## 🌐 API Endpoints

### Autenticación
- `GET /protected` - Verificar autenticación
- `GET /me` - Obtener información del usuario actual

### Siniestros
- `GET /siniestros` - Listar siniestros
- `GET /siniestros/{id}` - Obtener siniestro específico
- `POST /siniestros` - Crear nuevo siniestro
- `PUT /siniestros/{id}` - Actualizar siniestro

### Estadísticas
- `GET /estadisticas/generales` - Estadísticas generales
- `GET /estadisticas/por-tipo` - Estadísticas por tipo
- `GET /estadisticas/por-tipo-perdida` - Estadísticas de pérdidas

### Sucursales
- `GET /vista_sucursales` - Información de sucursales con estadísticas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Desarrollado por

Sistema desarrollado como proyecto académico para la gestión integral de siniestros bancarios.

---

**Nota**: Este es un proyecto educativo. Para uso en producción, se recomienda implementar medidas adicionales de seguridad y optimización.
