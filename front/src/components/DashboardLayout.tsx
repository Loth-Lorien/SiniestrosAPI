'use client';

import { ReactNode } from 'react';
import { 
  FiHome, 
  FiBarChart, 
  FiFileText, 
  FiUsers,
  FiAlertTriangle,
  FiLogOut,
  FiUser
} from 'react-icons/fi';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  icon: ReactNode;
  label: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: <FiHome className="w-5 h-5" />,
    label: 'Dashboard',
    description: 'Vista general y estadísticas'
  },
  {
    href: '/siniestros',
    icon: <FiAlertTriangle className="w-5 h-5" />,
    label: 'Siniestros',
    description: 'Gestión de siniestros'
  },
  {
    href: '/estadisticas',
    icon: <FiBarChart className="w-5 h-5" />,
    label: 'Estadísticas',
    description: 'Análisis y reportes'
  },
  {
    href: '/reportes',
    icon: <FiFileText className="w-5 h-5" />,
    label: 'Reportes',
    description: 'Informes detallados'
  },
  {
    href: '/sucursales',
    icon: <FiUsers className="w-5 h-5" />,
    label: 'Sucursales',
    description: 'Gestión de sucursales'
  }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authContext = useAuth();
  const { user, logout } = authContext || { user: null, logout: () => {} };

  // Si no hay contexto de auth disponible, usar valores por defecto
  if (!authContext) {
    console.error('DashboardLayout: AuthContext no está disponible');
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
        {/* Header del Sidebar */}
        <div className="flex items-center justify-center h-16 bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Siniestros</h1>
              <p className="text-xs text-blue-200">Sistema de Gestión</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className={`
                      ${isActive ? 'text-blue-700' : 'text-gray-400'}
                    `}>
                      {item.icon}
                    </span>
                    <div className="ml-3">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Usuario y Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          {user && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-900">{user.nombre}</p>
                    <p className="text-xs text-blue-600">{user.rol}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-blue-600 hover:text-red-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="p-3 bg-gray-100 rounded-lg text-center">
            <p className="text-xs text-gray-600">API Siniestros v1.0</p>
            <p className="text-xs text-gray-500">Desarrollado con Next.js</p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="ml-64">
        {/* Header Superior */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Dashboard Siniestros
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de gestión y análisis de siniestros
                </p>
              </div>
              
              {/* Acciones del Header */}
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiUser className="w-4 h-4" />
                    <span>Bienvenido, {user.nombre}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>API Conectada</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
