import React, { createContext, useContext, useState, useEffect } from 'react';

export const ROLES = {
  ADMIN: {
    id: 'ADMIN',
    username: 'admin',
    password: 'admin123',
    defaultLabel: 'Admin (Acceso Total)',
    badgeColor: '#dc2626',
    permissions: 'CRUD + Diagnostics Lab',
  },
  TEACHER: {
    id: 'TEACHER',
    username: 'teacher',
    password: 'teacher123',
    defaultLabel: 'Docente (Gestión Académica)',
    badgeColor: '#2563eb',
    permissions: 'CRUD Cursos & Alumnos',
  },
  STUDENT: {
    id: 'STUDENT',
    username: 'student',
    password: 'student123',
    defaultLabel: 'Estudiante (Solo Lectura)',
    badgeColor: '#16a34a',
    permissions: 'Solo Lectura (Bloqueo Mutaciones 403)',
  },
  ANONYMOUS: {
    id: 'ANONYMOUS',
    username: '',
    password: '',
    defaultLabel: 'Anónimo (Público)',
    badgeColor: '#64748b',
    permissions: 'Sin Credenciales (401 en mutaciones)',
  },
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Default to ADMIN so first-time visitors can test everything without friction
  const [currentRoleKey, setCurrentRoleKey] = useState(() => {
    try {
      return localStorage.getItem('academic_current_role') || 'ADMIN';
    } catch (_) {
      return 'ADMIN';
    }
  });

  const currentRole = ROLES[currentRoleKey] || ROLES.ADMIN;

  useEffect(() => {
    try {
      localStorage.setItem('academic_current_role', currentRole.id);
    } catch (_) {}
  }, [currentRole]);

  const switchRole = (roleKey) => {
    if (ROLES[roleKey]) {
      setCurrentRoleKey(roleKey);
    }
  };

  const canCreate = currentRole.id === 'ADMIN' || currentRole.id === 'TEACHER';
  const canEdit = currentRole.id === 'ADMIN' || currentRole.id === 'TEACHER';
  const canDelete = currentRole.id === 'ADMIN' || currentRole.id === 'TEACHER';
  const canViewDetails = currentRole.id !== 'ANONYMOUS';
  const canAccessLab = currentRole.id === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        switchRole,
        roles: ROLES,
        canCreate,
        canEdit,
        canDelete,
        canViewDetails,
        canAccessLab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Graceful fallback for isolated component testing (defaults to ADMIN with all permissions)
    return {
      currentRole: ROLES.ADMIN,
      switchRole: () => {},
      roles: ROLES,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canViewDetails: true,
      canAccessLab: true,
    };
  }
  return context;
}
