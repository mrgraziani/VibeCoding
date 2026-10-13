import React, { useState, useEffect } from 'react';
import { apiClient, extractErrorMessage } from '../../api';
import { useToast } from '../../ToastContext';
import { useI18n } from '../../i18n/I18nContext';
import { PERSON_ROLES, DEFAULT_ROLE } from '../constants';

export default function PersonFormModal({
  isOpen,
  onClose,
  editingPerson,
  filterType,
  roleLabel,
  onSuccess,
}) {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    personType: filterType || DEFAULT_ROLE,
  });

  useEffect(() => {
    if (editingPerson) {
      setForm({
        firstName: editingPerson.firstName || '',
        lastName: editingPerson.lastName || '',
        email: editingPerson.email || '',
        personType: editingPerson.personType || filterType || DEFAULT_ROLE,
      });
    } else {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        personType: filterType || DEFAULT_ROLE,
      });
    }
  }, [editingPerson, filterType, isOpen]);

  // Accessibility: Handle Escape key to close modal
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

  if (!isOpen) return null;

  async function submitForm(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      addToast(t('persons.validationError'), 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      id: editingPerson ? editingPerson.id : null,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      personType: form.personType || filterType || DEFAULT_ROLE,
    };

    try {
      if (editingPerson) {
        await apiClient.put(`/persons/${editingPerson.id}`, payload);
        addToast(t('persons.updatedToast', { name: payload.firstName }), 'success');
      } else {
        await apiClient.post('/persons', payload);
        addToast(t('persons.createdToast', { name: payload.firstName }), 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const modalTitle = editingPerson
    ? t('persons.editModalTitle', {
        role: roleLabel,
        name: `${editingPerson.firstName} ${editingPerson.lastName}`,
      })
    : t('persons.createModalTitle', { role: roleLabel });

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-form-modal-title"
    >
      <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
        <div
          className="d-flex justify-content-between align-items-center mb-3 pb-2"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h4 id="person-form-modal-title" style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
            {modalTitle}
          </h4>
          <button
            onClick={onClose}
            className="btn-modern-secondary"
            style={{ padding: '0.2rem 0.6rem' }}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitForm} className="row g-3">
          <div className="col-12">
            <label htmlFor="person-firstName" className="form-label text-muted small">
              {t('persons.firstName')}
            </label>
            <input
              id="person-firstName"
              className="form-control modern-input"
              placeholder={t('persons.firstNamePlaceholder')}
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="col-12">
            <label htmlFor="person-lastName" className="form-label text-muted small">
              {t('persons.lastName')}
            </label>
            <input
              id="person-lastName"
              className="form-control modern-input"
              placeholder={t('persons.lastNamePlaceholder')}
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>

          <div className="col-12">
            <label htmlFor="person-email" className="form-label text-muted small">
              {t('persons.email')}
            </label>
            <input
              id="person-email"
              type="email"
              className="form-control modern-input"
              placeholder="ada@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="col-12">
            <label htmlFor="person-role" className="form-label text-muted small">
              {t('persons.role')}
            </label>
            <select
              id="person-role"
              className="form-select modern-select"
              value={form.personType}
              onChange={e => setForm(f => ({ ...f, personType: e.target.value }))}
              disabled={Boolean(filterType)}
            >
              <option value={PERSON_ROLES.STUDENT}>{t('roles.student')}</option>
              <option value={PERSON_ROLES.TEACHER}>{t('roles.teacher')}</option>
            </select>
          </div>

          <div
            className="col-12 d-flex justify-content-end gap-2 mt-4 pt-2"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <button
              type="button"
              className="btn-modern-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-modern-primary"
              disabled={submitting}
            >
              {submitting
                ? t('common.loading')
                : editingPerson
                ? t('persons.updateBtn', { role: roleLabel })
                : t('persons.createBtn', { role: roleLabel })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
