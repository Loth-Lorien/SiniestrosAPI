import { useAuth } from '@/contexts/AuthContext';

export interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canViewStatistics: boolean;
}

export const usePermissions = (): Permissions => {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: false,
      canManageUsers: false,
      canViewReports: false,
      canViewStatistics: false,
    };
  }

  const role = user.rol?.toLowerCase();

  switch (role) {
    case 'admin':
    case 'administrador':
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canView: true,
        canManageUsers: true,
        canViewReports: true,
        canViewStatistics: true,
      };
    
    case 'coordinador':
    case 'supervisor':
      return {
        canCreate: true,
        canEdit: true,
        canDelete: false, // Coordinador no puede eliminar
        canView: true,
        canManageUsers: false,
        canViewReports: true,
        canViewStatistics: true,
      };
    
    case 'operador':
      return {
        canCreate: true,
        canEdit: false, // Operador no puede editar
        canDelete: false, // Operador no puede eliminar
        canView: true,
        canManageUsers: false,
        canViewReports: true,
        canViewStatistics: false,
      };
    
    default:
      // Rol desconocido, permisos mínimos
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canView: true,
        canManageUsers: false,
        canViewReports: false,
        canViewStatistics: false,
      };
  }
};
