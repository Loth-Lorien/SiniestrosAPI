'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { FiLoader } from 'react-icons/fi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Efecto para marcar cuando el componente está completamente montado
  useEffect(() => {
    setMounted(true);
    console.log('🔍 ProtectedRoute: Componente montado');
  }, []);

  // Efecto para manejar redirección SOLO después de un tiempo considerable
  useEffect(() => {
    if (!mounted) return; // No hacer nada hasta estar completamente montado

    console.log('ProtectedRoute: Estado actual:', { 
      isLoading, 
      isAuthenticated, 
      user: user ? `${user.nombre} (${user.rol})` : 'null',
      mounted
    });

    // Solo redirigir después de 5 segundos Y si realmente no hay autenticación
    let redirectTimer: NodeJS.Timeout | null = null;

    if (!isLoading && !isAuthenticated) {
      const hasToken = localStorage.getItem('auth_token');
      const hasUserData = localStorage.getItem('user_data');
      
      console.log('⚠️ ProtectedRoute: Usuario no autenticado. Verificando localStorage...', {
        hasToken: !!hasToken,
        hasUserData: !!hasUserData
      });

      // Solo redirigir si NO hay datos en localStorage tampoco
      if (!hasToken && !hasUserData) {
        console.log('⏰ ProtectedRoute: No hay datos de autenticación. Redirigiendo en 5 segundos...');
        
        redirectTimer = setTimeout(() => {
          console.log('🚀 ProtectedRoute: Ejecutando redirección a login');
          router.push('/login');
        }, 5000); // 5 segundos de gracia
      } else {
        console.log('🔄 ProtectedRoute: Hay datos en localStorage, esperando sincronización...');
      }
    }

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [isAuthenticated, isLoading, user, mounted, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espere</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Acceso no autorizado</p>
          <p className="text-sm text-gray-500 mt-2">Redirigiendo al login en unos segundos...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
