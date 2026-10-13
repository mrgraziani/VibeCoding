import React from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../ToastContext';

export default function RoleSwitcher() {
  const { currentRole, switchRole, roles } = useAuth();
  const { addToast } = useToast();

  const handleRoleChange = (e) => {
    const newRoleKey = e.target.value;
    switchRole(newRoleKey);
    const selected = roles[newRoleKey];
    if (selected && addToast) {
      addToast(`Rol de seguridad activado: ${selected.defaultLabel}`, 'info');
    }
  };

  return (
    <div className="d-flex align-items-center gap-1" style={{ position: 'relative' }}>
      <span style={{ fontSize: '1rem', marginRight: 2 }} role="img" aria-label="Security Role">
        🛡️
      </span>
      <select
        id="role-switcher"
        className="form-select modern-select"
        value={currentRole.id}
        onChange={handleRoleChange}
        aria-label="Select security role"
        title={`Rol activo: ${currentRole.permissions}`}
        style={{
          width: 'auto',
          minWidth: '160px',
          padding: '0.35rem 1.8rem 0.35rem 0.65rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: 'rgba(15, 23, 42, 0.8)',
          borderColor: currentRole.badgeColor || 'rgba(99, 102, 241, 0.35)',
          color: '#f8fafc',
          cursor: 'pointer',
        }}
      >
        <option value="ADMIN">🔴 Admin (Acceso Total)</option>
        <option value="TEACHER">🔵 Docente (Gestión)</option>
        <option value="STUDENT">🟢 Estudiante (Lectura)</option>
        <option value="ANONYMOUS">⚪ Anónimo (Público)</option>
      </select>
    </div>
  );
}
