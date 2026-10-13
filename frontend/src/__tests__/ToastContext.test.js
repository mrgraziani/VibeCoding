import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';

function TestComponent() {
  const { addToast } = useToast();
  return (
    <div>
      <button onClick={() => addToast('Operación exitosa', 'success')}>Toast Exito</button>
      <button onClick={() => addToast('Ocurrió un error', 'error')}>Toast Error</button>
      <button onClick={() => addToast('Mensaje informativo', 'info')}>Toast Info</button>
    </div>
  );
}

describe('ToastContext & ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('adds and renders toasts with respective types and dismisses on click', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Toast Exito'));
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Toast Error'));
    expect(screen.getByText('Ocurrió un error')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();

    // Dismiss one toast via close button
    const closeButtons = screen.getAllByLabelText('Close');
    fireEvent.click(closeButtons[0]);
    expect(screen.queryByText('Operación exitosa')).not.toBeInTheDocument();
  });

  test('auto-dismisses toasts after timer expires', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Toast Info'));
    expect(screen.getByText('Mensaje informativo')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Mensaje informativo')).not.toBeInTheDocument();
  });
});
