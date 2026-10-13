import React, { createContext, useContext, useState, useCallback } from 'react';
import { useI18n } from './i18n/I18nContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { t: translate } = useI18n();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container-custom" aria-live="polite">
        {toasts.map(toastItem => (
          <div key={toastItem.id} className={`toast-item ${toastItem.type}`} role="alert">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>
                {toastItem.type === 'error' ? translate('common.error') : toastItem.type === 'success' ? translate('common.success') : translate('common.info')}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>{toastItem.message}</div>
            </div>
            <button
              onClick={() => removeToast(toastItem.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0 4px',
              }}
              aria-label={translate('common.close')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`),
      removeToast: () => {},
    };
  }
  return context;
}
