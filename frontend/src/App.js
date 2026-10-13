import React, { useState, useEffect } from 'react';
import PersonCrud from './persons/PersonCrud';
import CourseCrud from './courses/CourseCrud';
import Java25Dashboard from './system/Java25Dashboard';
import { ToastProvider } from './ToastContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import LanguageSelector from './i18n/LanguageSelector';
import { apiClient } from './api';

function Teachers() {
  return <PersonCrud filterType="TEACHER" />;
}

function Students() {
  return <PersonCrud filterType="STUDENT" />;
}

function MainApp() {
  const { t } = useI18n();
  const [page, setPage] = useState('students');
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      await apiClient.get('/persons');
      setBackendOnline(true);
    } catch (err) {
      setBackendOnline(false);
    }
  }

  return (
    <div>
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="container-fluid d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <span className="brand-badge">
              PersonCrud
            </span>
            <span className="brand-pill">Java 25 Modern Stack</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="d-flex align-items-center gap-2">
            <button
              className={`nav-tab-btn ${page === 'students' ? 'active' : ''}`}
              onClick={() => setPage('students')}
              id="tab-students"
            >
              {t('nav.students')}
            </button>
            <button
              className={`nav-tab-btn ${page === 'teachers' ? 'active' : ''}`}
              onClick={() => setPage('teachers')}
              id="tab-teachers"
            >
              {t('nav.teachers')}
            </button>
            <button
              className={`nav-tab-btn ${page === 'courses' ? 'active' : ''}`}
              onClick={() => setPage('courses')}
              id="tab-courses"
            >
              {t('nav.courses')}
            </button>
            <button
              className={`nav-tab-btn ${page === 'java25' ? 'active' : ''}`}
              onClick={() => setPage('java25')}
              id="tab-java25"
            >
              <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>⚡</span> {t('nav.java25')}
            </button>
          </nav>

          {/* Right Section: Language Selector combo & Backend Status */}
          <div className="d-flex align-items-center gap-3">
            <LanguageSelector />

            <div>
              {backendOnline === true && (
                <span className="status-indicator online" title="Backend Java 25 conectado">
                  <span className="status-dot"></span>
                  <span>{t('status.online')}</span>
                </span>
              )}
              {backendOnline === false && (
                <span className="status-indicator offline" title="No se pudo contactar al backend">
                  <span className="status-dot"></span>
                  <span>{t('status.offline')}</span>
                </span>
              )}
              {backendOnline === null && (
                <span className="status-indicator" style={{ color: '#94a3b8' }}>
                  {t('status.checking')}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container my-4">
        {page === 'students' && <Students />}
        {page === 'teachers' && <Teachers />}
        {page === 'courses' && <CourseCrud />}
        {page === 'java25' && <Java25Dashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </I18nProvider>
  );
}
