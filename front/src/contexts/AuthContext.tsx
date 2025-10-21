'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../lib/services';
import { LoginCredentials, LoginResponse } from '../types/api';

interface User {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth: AuthContext no está disponible. Asegúrate de usar AuthProvider.');
    // En lugar de lanzar error, devolver valores por defecto
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async () => { throw new Error('AuthProvider no disponible'); },
      logout: () => { console.warn('AuthProvider no disponible'); },
      checkAuth: () => { console.warn('AuthProvider no disponible'); }
    };
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🚀 AuthProvider: Iniciando AuthProvider');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🔍 [${timestamp}] AuthContext: checkAuth ejecutándose...`);
    try {
      const userData = authService.getCurrentUser();
      const credentials = localStorage.getItem('auth_credentials');
      
      console.log(`📊 [${timestamp}] AuthContext: userData from localStorage:`, userData);
      console.log(`🔑 [${timestamp}] AuthContext: credentials from localStorage:`, credentials ? 'exists' : 'not found');
      
      if (userData && credentials) {
        console.log(`✅ [${timestamp}] AuthContext: Usuario válido encontrado, estableciendo estado`);
        setUser(userData);
      } else {
        console.log(`❌ [${timestamp}] AuthContext: No se encontró usuario válido, limpiando estado`);
        console.log(`🧹 [${timestamp}] AuthContext: Razón - userData: ${!!userData}, credentials: ${!!credentials}`);
        setUser(null);
      }
    } catch (error) {
      console.error(`💥 [${timestamp}] AuthContext: Error checking auth:`, error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Iniciando login...');
      const response = await authService.login(credentials);
      console.log('AuthContext: Respuesta recibida:', response);
      
      if (response.user_info) {
        console.log('AuthContext: Estableciendo usuario:', response.user_info);
        setUser(response.user_info);
        setIsLoading(false);
      }
      
      return response;
    } catch (error) {
      console.error('AuthContext: Error en login:', error);
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Ejecutando logout...');
    authService.logout();
    setUser(null);
    console.log('AuthContext: Logout completado');
  };

  useEffect(() => {
    console.log('🚀 AuthContext: Montando componente');
    
    // MODO ULTRA CONSERVADOR - JAMÁS limpiar datos existentes
    let attempts = 0;
    const maxAttempts = 3;
    
    const tryRestore = () => {
      attempts++;
      console.log(`🔍 AuthContext: Intento #${attempts} de restaurar datos...`);
      
      const credentials = localStorage.getItem('auth_credentials');
      const userData = localStorage.getItem('user_data');
      
      console.log(`📊 AuthContext: Datos encontrados - credentials: ${!!credentials}, userData: ${!!userData}`);
      
      if (credentials && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('✅ AuthContext: Restaurando estado desde localStorage:', parsedUser);
          setUser(parsedUser);
          setIsLoading(false);
          return; // ¡Éxito! Salir
        } catch (error) {
          console.error('❌ AuthContext: Error parsing user data:', error);
        }
      }
      
      // Si no encontró datos, intentar de nuevo (hasta 3 veces)
      if (attempts < maxAttempts) {
        console.log(`🔄 AuthContext: No encontró datos, reintentando en 200ms...`);
        setTimeout(tryRestore, 200);
      } else {
        console.log('ℹ️ AuthContext: No hay datos de auth después de 3 intentos (NO limpiando nada)');
        setIsLoading(false);
        // IMPORTANTE: NO establecer setUser(null) aquí
      }
    };
    
    // Empezar después de un pequeño delay
    setTimeout(tryRestore, 100);
    
    // Listener para cambios en localStorage (deshabilitado temporalmente)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('📦 AuthContext: Storage cambió:', {
        key: e.key, 
        oldValue: e.oldValue?.substring(0, 50), 
        newValue: e.newValue?.substring(0, 50)
      });
      if (e.key === 'auth_credentials' || e.key === 'user_data') {
        console.log('🔄 AuthContext: Cambio en storage de auth (no ejecutando checkAuth automáticamente)');
        // checkAuth(); // Comentado temporalmente para debugging
      }
    };
    
    // Listener para cuando la ventana recupera el foco (deshabilitado temporalmente)
    const handleFocus = () => {
      console.log('👁️ AuthContext: Ventana recuperó foco (no ejecutando checkAuth automáticamente)');
      // checkAuth(); // Comentado temporalmente para debugging
    };
    
    // Agregar listener para detectar si algo está modificando localStorage
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key: string, value: string) {
      if (key === 'auth_credentials' || key === 'user_data') {
        console.log(`💾 localStorage.setItem interceptado: ${key} = ${value?.substring(0, 50)}`);
        console.trace('Stack trace del setItem:');
      }
      return originalSetItem.call(this, key, value);
    };
    
    localStorage.removeItem = function(key: string) {
      if (key === 'auth_credentials' || key === 'user_data') {
        console.log(`🗑️ localStorage.removeItem interceptado: ${key}`);
        console.trace('Stack trace del removeItem:');
      }
      return originalRemoveItem.call(this, key);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      
      // Restaurar métodos originales
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
