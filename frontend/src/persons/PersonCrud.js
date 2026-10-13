import React, { useEffect, useState, useCallback } from 'react';
import { apiClient, extractErrorMessage } from '../api';
import { useToast } from '../ToastContext';
import { useI18n } from '../i18n/I18nContext';

export default function PersonCrud({ filterType }) {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPerson, setViewPerson] = useState(null);
  const [associatedCourses, setAssociatedCourses] = useState([]);

  // Form modal state (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    personType: filterType || 'STUDENT',
  });

  const formatRole = useCallback((type) => {
    if (!type) return t('roles.person');
    const upper = String(type).toUpperCase();
    if (upper === 'TEACHER') return t('roles.teacher');
    if (upper === 'STUDENT') return t('roles.student');
    return t('roles.person');
  }, [t]);

  const fetchPersons = useCallback(async (query = '') => {
    setLoading(true);
    try {
      let res;
      if (query.trim()) {
        res = await apiClient.get(`/persons/search?lastName=${encodeURIComponent(query.trim())}`);
      } else {
        res = await apiClient.get('/persons');
      }

      const list = res.data || [];
      if (filterType === 'STUDENT') {
        setPersons(list.filter(p => p.personType === 'STUDENT'));
      } else if (filterType === 'TEACHER') {
        setPersons(list.filter(p => p.personType === 'TEACHER'));
      } else {
        setPersons(list);
      }
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [filterType, addToast]);

  useEffect(() => {
    fetchPersons(searchTerm);
  }, [filterType, fetchPersons]);

  function handleSearch(e) {
    e.preventDefault();
    fetchPersons(searchTerm);
  }

  function handleClearSearch() {
    setSearchTerm('');
    fetchPersons('');
  }

  // --- View Modal Handlers ---
  async function openViewModal(p) {
    setViewPerson(p);
    setAssociatedCourses([]);
    setIsViewModalOpen(true);

    try {
      const res = await apiClient.get('/courses');
      const allCourses = res.data || [];
      if (p.personType === 'TEACHER') {
        setAssociatedCourses(allCourses.filter(c => c.teacherId === p.id || String(c.teacherId) === String(p.id)));
      } else {
        setAssociatedCourses(allCourses.filter(c => (c.studentIds || []).some(id => id === p.id || String(id) === String(p.id))));
      }
    } catch (err) {
      console.warn('Could not load associated courses:', err);
    }
  }

  function closeViewModal() {
    setIsViewModalOpen(false);
    setViewPerson(null);
  }

  // --- Form Modal Handlers ---
  function openCreateModal() {
    setEditingPerson(null);
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      personType: filterType || 'STUDENT',
    });
    setIsFormModalOpen(true);
  }

  function openEditModal(p) {
    setEditingPerson(p);
    setForm({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      email: p.email || '',
      personType: p.personType || filterType || 'STUDENT',
    });
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
    }
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    setEditingPerson(null);
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      addToast(t('persons.validationError'), 'error');
      return;
    }

    const payload = {
      id: editingPerson ? editingPerson.id : null,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      personType: form.personType || filterType || 'STUDENT',
    };

    try {
      if (editingPerson) {
        await apiClient.put(`/persons/${editingPerson.id}`, payload);
        addToast(t('persons.updatedToast', { name: payload.firstName }), 'success');
      } else {
        await apiClient.post('/persons', payload);
        addToast(t('persons.createdToast', { name: payload.firstName }), 'success');
      }
      closeFormModal();
      fetchPersons(searchTerm);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  }

  async function removePerson(p) {
    if (!window.confirm(t('persons.deleteConfirm', { name: `${p.firstName} ${p.lastName}` }))) return;
    try {
      await apiClient.delete(`/persons/${p.id}`);
      addToast(t('persons.deletedToast', { name: p.firstName }), 'info');
      fetchPersons(searchTerm);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  }

  const title = filterType === 'TEACHER' ? t('persons.teachersTitle') : filterType === 'STUDENT' ? t('persons.studentsTitle') : t('persons.personsTitle');
  const roleLabel = formatRole(filterType || 'STUDENT');

  return (
    <div className="glass-card">
      {/* Header with Title, Search bar and Create Button */}
      <div className="glass-card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <h2 className="glass-card-title d-flex align-items-center gap-2 mb-0">
          <span>{title}</span>
          <span className="badge-glow-indigo">{t('persons.registeredCount', { count: persons.length })}</span>
        </h2>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <input
              className="modern-input"
              placeholder={t('persons.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '200px' }}
            />
            <button type="submit" className="btn-modern-primary" style={{ padding: '0.5rem 0.9rem' }}>
              {t('persons.searchBtn')}
            </button>
            {searchTerm && (
              <button type="button" onClick={handleClearSearch} className="btn-modern-secondary" style={{ padding: '0.5rem 0.8rem' }}>
                {t('persons.clearBtn')}
              </button>
            )}
          </form>

          {/* New Person Button */}
          <button
            type="button"
            className="btn-modern-primary"
            onClick={openCreateModal}
            id="btn-open-create-person"
          >
            {t('persons.newBtn', { role: roleLabel })}
          </button>
        </div>
      </div>

      {/* Persons List */}
      <div>
        {loading ? (
          <div className="text-center py-4 text-muted">{t('persons.loading')}</div>
        ) : persons.length === 0 ? (
          <div className="text-center py-5 text-muted">
            {t('persons.noRecords', { title: title.toLowerCase() })}
          </div>
        ) : (
          persons.map(p => (
            <div key={p.id} className="glass-list-item">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#f8fafc' }}>
                    {p.firstName} {p.lastName}
                  </span>
                  <span className={`badge-role ${p.personType === 'TEACHER' ? 'teacher' : p.personType === 'STUDENT' ? 'student' : 'person'}`}>
                    {formatRole(p.personType)}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {p.email} <span className="text-dim" style={{ marginLeft: 8 }}>#{t('common.id')}: {p.id}</span>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn-modern-cyan"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => openViewModal(p)}
                  aria-label={`${t('persons.viewBtn')} ${p.firstName}`}
                >
                  {t('persons.viewBtn')}
                </button>
                <button
                  className="btn-modern-outline"
                  onClick={() => openEditModal(p)}
                  aria-label={`${t('common.edit')} ${p.firstName}`}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="btn-modern-danger"
                  onClick={() => removePerson(p)}
                  aria-label={`${t('common.delete')} ${p.firstName}`}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 1. VIEW MODAL (Read-only Profile Card) */}
      {isViewModalOpen && viewPerson && (
        <div className="modal-backdrop-custom" onClick={closeViewModal} role="dialog" aria-modal="true">
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span className="brand-pill me-2">{formatRole(viewPerson.personType)} #{viewPerson.id}</span>
                <h4 style={{ margin: '0.35rem 0 0 0', fontWeight: 700, color: '#f8fafc' }}>
                  {t('persons.viewModalTitle', { role: formatRole(viewPerson.personType), name: `${viewPerson.firstName} ${viewPerson.lastName}` })}
                </h4>
              </div>
              <button
                onClick={closeViewModal}
                className="btn-modern-secondary"
                style={{ padding: '0.2rem 0.6rem' }}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="p-3 mb-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="small text-dim">{t('persons.role')}</div>
                  <div className="mt-1">
                    <span className={`badge-role ${viewPerson.personType === 'TEACHER' ? 'teacher' : 'student'}`}>
                      {formatRole(viewPerson.personType)}
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="small text-dim">{t('persons.email')}</div>
                  <div style={{ color: '#f8fafc', fontWeight: 500 }} className="mt-1">
                    {viewPerson.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Courses */}
            <div className="mb-4">
              <div className="small text-dim mb-2">{t('persons.associatedCourses')}</div>
              <div style={{ maxHeight: 150, overflowY: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12 }}>
                {associatedCourses.length === 0 ? (
                  <div className="text-muted small fst-italic">{t('persons.noAssociatedCourses')}</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {associatedCourses.map(c => (
                      <div key={c.id} className="d-flex justify-content-between align-items-center p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
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

            {/* View Modal Footer Actions */}
            <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn-modern-secondary" onClick={closeViewModal}>
                {t('common.close')}
              </button>
              <button
                type="button"
                className="btn-modern-primary"
                onClick={() => openEditModal(viewPerson)}
              >
                {t('common.edit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FORM MODAL (Create or Edit Person) */}
      {isFormModalOpen && (
        <div className="modal-backdrop-custom" onClick={closeFormModal} role="dialog" aria-modal="true">
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
                {editingPerson
                  ? t('persons.editModalTitle', { role: formatRole(editingPerson.personType), name: `${editingPerson.firstName} ${editingPerson.lastName}` })
                  : t('persons.createModalTitle', { role: roleLabel })}
              </h4>
              <button
                onClick={closeFormModal}
                className="btn-modern-secondary"
                style={{ padding: '0.2rem 0.6rem' }}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="row g-3">
              <div className="col-12">
                <label className="form-label text-muted small">{t('persons.firstName')}</label>
                <input
                  className="form-control modern-input"
                  placeholder={t('persons.firstNamePlaceholder')}
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted small">{t('persons.lastName')}</label>
                <input
                  className="form-control modern-input"
                  placeholder={t('persons.lastNamePlaceholder')}
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted small">{t('persons.email')}</label>
                <input
                  type="email"
                  className="form-control modern-input"
                  placeholder="ada@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted small">{t('persons.role')}</label>
                <select
                  className="form-select modern-select"
                  value={form.personType}
                  onChange={e => setForm({ ...form, personType: e.target.value })}
                  disabled={Boolean(filterType)}
                >
                  <option value="STUDENT">{t('roles.student')}</option>
                  <option value="TEACHER">{t('roles.teacher')}</option>
                </select>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-modern-secondary" onClick={closeFormModal}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-modern-primary">
                  {editingPerson ? t('persons.updateBtn', { role: roleLabel }) : t('persons.createBtn', { role: roleLabel })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
