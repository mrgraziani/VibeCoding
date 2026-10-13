import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api';
import { useI18n } from '../../i18n/I18nContext';
import { PERSON_ROLES } from '../constants';

export default function PersonViewModal({
  isOpen,
  onClose,
  person,
  formatRole,
  onEditClick,
}) {
  const { t } = useI18n();
  const [associatedCourses, setAssociatedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (!isOpen || !person) return;

    let isCurrent = true;
    setLoadingCourses(true);
    setAssociatedCourses([]);

    async function loadCourses() {
      try {
        const res = await apiClient.get(`/persons/${person.id}/courses`);
        if (!isCurrent) return;
        setAssociatedCourses(res.data || []);
      } catch (err) {
        console.warn('Could not load associated courses:', err);
      } finally {
        if (isCurrent) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, person]);

  // Accessibility: Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !person) return null;

  const roleText = formatRole(person.personType);

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-view-modal-title"
    >
      <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
        <div
          className="d-flex justify-content-between align-items-center mb-3 pb-2"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div>
            <span className="brand-pill me-2">
              {roleText} #{person.id}
            </span>
            <h4
              id="person-view-modal-title"
              style={{ margin: '0.35rem 0 0 0', fontWeight: 700, color: '#f8fafc' }}
            >
              {t('persons.viewModalTitle', {
                role: roleText,
                name: `${person.firstName} ${person.lastName}`,
              })}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="btn-modern-secondary"
            style={{ padding: '0.2rem 0.6rem' }}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {/* Profile Overview Card */}
        <div
          className="p-3 mb-4 rounded"
          style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}
        >
          <div className="row g-3">
            <div className="col-sm-6">
              <div className="small text-dim">{t('persons.role')}</div>
              <div className="mt-1">
                <span
                  className={`badge-role ${
                    person.personType === PERSON_ROLES.TEACHER ? 'teacher' : 'student'
                  }`}
                >
                  {roleText}
                </span>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="small text-dim">{t('persons.email')}</div>
              <div style={{ color: '#f8fafc', fontWeight: 500 }} className="mt-1">
                {person.email}
              </div>
            </div>
          </div>
        </div>

        {/* Associated Courses */}
        <div className="mb-4">
          <div className="small text-dim mb-2">{t('persons.associatedCourses')}</div>
          <div
            style={{
              maxHeight: 150,
              overflowY: 'auto',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            {loadingCourses ? (
              <div className="text-center py-2 text-muted small">{t('common.loading')}</div>
            ) : associatedCourses.length === 0 ? (
              <div className="text-muted small fst-italic">{t('persons.noAssociatedCourses')}</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {associatedCourses.map(c => (
                  <div
                    key={c.id}
                    className="d-flex justify-content-between align-items-center p-2 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{c.name}</span>
                    <span className="badge-glow-indigo" style={{ fontSize: '0.75rem' }}>
                      #{c.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="d-flex justify-content-end gap-2 pt-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button type="button" className="btn-modern-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
          <button
            type="button"
            className="btn-modern-primary"
            onClick={() => onEditClick(person)}
          >
            {t('common.edit')}
          </button>
        </div>
      </div>
    </div>
  );
}
