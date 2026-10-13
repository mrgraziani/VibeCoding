import React from 'react';
import { useI18n } from './I18nContext';

export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="d-flex align-items-center gap-1" style={{ position: 'relative' }}>
      <span style={{ fontSize: '1rem', marginRight: 2 }} role="img" aria-label="Language">
        🌐
      </span>
      <select
        id="language-selector"
        className="form-select modern-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label="Select language"
        style={{
          width: 'auto',
          minWidth: '110px',
          padding: '0.35rem 1.8rem 0.35rem 0.65rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: 'rgba(15, 23, 42, 0.8)',
          borderColor: 'rgba(99, 102, 241, 0.35)',
          color: '#f8fafc',
          cursor: 'pointer',
        }}
      >
        <option value="en">🇬🇧 English</option>
        <option value="fr">🇫🇷 Français</option>
        <option value="es">🇪🇸 Español</option>
      </select>
    </div>
  );
}
