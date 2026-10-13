import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import RoleSwitcher from '../auth/RoleSwitcher';
import { ToastProvider } from '../ToastContext';

function TestAuthConsumer() {
  const { currentRole } = useAuth();
  return <div data-testid="active-role">{currentRole.id}</div>;
}

describe('AuthContext and RoleSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to ADMIN role for frictionless initial testing', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('active-role')).toHaveTextContent('ADMIN');
  });

  test('switches roles and updates localStorage', async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <RoleSwitcher />
          <TestAuthConsumer />
        </AuthProvider>
      </ToastProvider>
    );

    const selector = screen.getByRole('combobox', { name: /Select security role/i });
    expect(selector.value).toBe('ADMIN');

    // Switch to TEACHER
    fireEvent.change(selector, { target: { value: 'TEACHER' } });
    expect(screen.getByTestId('active-role')).toHaveTextContent('TEACHER');
    expect(localStorage.getItem('academic_current_role')).toBe('TEACHER');

    // Switch to STUDENT
    fireEvent.change(selector, { target: { value: 'STUDENT' } });
    expect(screen.getByTestId('active-role')).toHaveTextContent('STUDENT');
    expect(localStorage.getItem('academic_current_role')).toBe('STUDENT');

    // Switch to ANONYMOUS
    fireEvent.change(selector, { target: { value: 'ANONYMOUS' } });
    expect(screen.getByTestId('active-role')).toHaveTextContent('ANONYMOUS');
    expect(localStorage.getItem('academic_current_role')).toBe('ANONYMOUS');
  });

  test('evaluates role permissions correctly across ADMIN, STUDENT, and ANONYMOUS', () => {
    function PermissionsConsumer() {
      const { canCreate, canEdit, canDelete, canViewDetails, canAccessLab } = useAuth();
      return (
        <div>
          <span data-testid="canCreate">{String(canCreate)}</span>
          <span data-testid="canEdit">{String(canEdit)}</span>
          <span data-testid="canDelete">{String(canDelete)}</span>
          <span data-testid="canViewDetails">{String(canViewDetails)}</span>
          <span data-testid="canAccessLab">{String(canAccessLab)}</span>
        </div>
      );
    }

    // 1. ADMIN: All capabilities enabled including Lab
    localStorage.setItem('academic_current_role', 'ADMIN');
    const { unmount } = render(
      <AuthProvider>
        <PermissionsConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('canCreate')).toHaveTextContent('true');
    expect(screen.getByTestId('canEdit')).toHaveTextContent('true');
    expect(screen.getByTestId('canDelete')).toHaveTextContent('true');
    expect(screen.getByTestId('canViewDetails')).toHaveTextContent('true');
    expect(screen.getByTestId('canAccessLab')).toHaveTextContent('true');
    unmount();

    // 2. STUDENT: Only details view enabled, mutations & lab blocked
    localStorage.setItem('academic_current_role', 'STUDENT');
    const studentRender = render(
      <AuthProvider>
        <PermissionsConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('canCreate')).toHaveTextContent('false');
    expect(screen.getByTestId('canEdit')).toHaveTextContent('false');
    expect(screen.getByTestId('canDelete')).toHaveTextContent('false');
    expect(screen.getByTestId('canViewDetails')).toHaveTextContent('true');
    expect(screen.getByTestId('canAccessLab')).toHaveTextContent('false');
    studentRender.unmount();

    // 3. ANONYMOUS: No action buttons at all
    localStorage.setItem('academic_current_role', 'ANONYMOUS');
    render(
      <AuthProvider>
        <PermissionsConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('canCreate')).toHaveTextContent('false');
    expect(screen.getByTestId('canEdit')).toHaveTextContent('false');
    expect(screen.getByTestId('canDelete')).toHaveTextContent('false');
    expect(screen.getByTestId('canViewDetails')).toHaveTextContent('false');
    expect(screen.getByTestId('canAccessLab')).toHaveTextContent('false');
  });
});
