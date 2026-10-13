import React, { useState, useCallback } from 'react';
import { apiClient, extractErrorMessage } from '../api';
import { useToast } from '../ToastContext';
import { useI18n } from '../i18n/I18nContext';
import { usePersons } from './hooks/usePersons';
import PersonFormModal from './components/PersonFormModal';
import PersonViewModal from './components/PersonViewModal';
import { PERSON_ROLES, DEFAULT_ROLE } from './constants';

export default function PersonCrud({ filterType }) {
  const { t } = useI18n();
  const { addToast } = useToast();

  // Custom hook encapsulating fetching, filtering, and race-condition safety
  const {
    persons,
    loading,
    searchTerm,
    setSearchTerm,
    fetchPersons,
  } = usePersons(filterType);

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPerson, setViewPerson] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const formatRole = useCallback(
    (type) => {
      if (!type) return t('roles.person');
      const upper = String(type).toUpperCase();
      if (upper === PERSON_ROLES.TEACHER) return t('roles.teacher');
      if (upper === PERSON_ROLES.STUDENT) return t('roles.student');
      return t('roles.person');
    },
    [t]
  );

  function handleSearch(e) {
    e.preventDefault();
    fetchPersons(searchTerm);
  }

  function handleClearSearch() {
    setSearchTerm('');
    fetchPersons('');
  }

  function openCreateModal() {
    setEditingPerson(null);
    setIsFormModalOpen(true);
  }

  function openEditModal(person) {
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
    }
    setEditingPerson(person);
    setIsFormModalOpen(true);
  }

  function openViewModal(person) {
    setViewPerson(person);
    setIsViewModalOpen(true);
  }

  async function removePerson(person) {
    const confirmMsg = t('persons.deleteConfirm', {
      name: `${person.firstName} ${person.lastName}`,
    });
    if (!window.confirm(confirmMsg)) return;

    try {
      await apiClient.delete(`/persons/${person.id}`);
      addToast(t('persons.deletedToast', { name: person.firstName }), 'info');
      fetchPersons(searchTerm);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  }

  const title =
    filterType === PERSON_ROLES.TEACHER
      ? t('persons.teachersTitle')
      : filterType === PERSON_ROLES.STUDENT
      ? t('persons.studentsTitle')
      : t('persons.personsTitle');

  const roleLabel = formatRole(filterType || DEFAULT_ROLE);

  return (
    <div className="glass-card">
      {/* Header with Title, Search bar and Create Button */}
      <div className="glass-card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <h2 className="glass-card-title d-flex align-items-center gap-2 mb-0">
          <span>{title}</span>
          <span className="badge-glow-indigo">
            {t('persons.registeredCount', { count: persons.length })}
          </span>
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
              aria-label={t('persons.searchPlaceholder')}
            />
            <button
              type="submit"
              className="btn-modern-primary"
              style={{ padding: '0.5rem 0.9rem' }}
            >
              {t('persons.searchBtn')}
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn-modern-secondary"
                style={{ padding: '0.5rem 0.8rem' }}
              >
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
                  <span
                    className={`badge-role ${
                      p.personType === PERSON_ROLES.TEACHER ? 'teacher' : 'student'
                    }`}
                  >
                    {formatRole(p.personType)}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {p.email}{' '}
                  <span className="text-dim" style={{ marginLeft: 8 }}>
                    #{t('common.id')}: {p.id}
                  </span>
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

      {/* View Modal */}
      <PersonViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        person={viewPerson}
        formatRole={formatRole}
        onEditClick={openEditModal}
      />

      {/* Form Modal (Create / Edit) */}
      <PersonFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingPerson={editingPerson}
        filterType={filterType}
        roleLabel={roleLabel}
        onSuccess={() => fetchPersons(searchTerm)}
      />
    </div>
  );
}
