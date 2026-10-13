import React, { useEffect, useState, useCallback } from 'react';
import { apiClient, extractErrorMessage } from '../api';
import { useToast } from '../ToastContext';
import { useI18n } from '../i18n/I18nContext';

export default function CourseCrud() {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);

  // View modal state (Read-only details & Java 25 features)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCourse, setViewCourse] = useState(null);
  const [firstStudent, setFirstStudent] = useState(null);
  const [lastStudent, setLastStudent] = useState(null);
  const [cohorts, setCohorts] = useState([]);

  // Form modal state (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ name: '', teacherId: '', studentIds: [] });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, personsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/persons'),
      ]);
      setCourses(coursesRes.data || []);
      setPersons(personsRes.data || []);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const teachers = persons.filter(p => p.personType === 'TEACHER');
  const students = persons.filter(p => p.personType === 'STUDENT');

  function personById(id) {
    if (id == null) return null;
    return persons.find(p => p.id === id || String(p.id) === String(id)) || null;
  }

  // --- View Modal Handlers ---
  async function openViewModal(course) {
    setViewCourse(course);
    setFirstStudent(null);
    setLastStudent(null);
    setCohorts([]);
    setIsViewModalOpen(true);

    try {
      const [firstRes, lastRes, cohortsRes] = await Promise.allSettled([
        apiClient.get(`/courses/${course.id}/students/first`),
        apiClient.get(`/courses/${course.id}/students/last`),
        apiClient.get(`/courses/${course.id}/cohorts?size=2`),
      ]);

      if (firstRes.status === 'fulfilled') setFirstStudent(firstRes.value.data);
      if (lastRes.status === 'fulfilled') setLastStudent(lastRes.value.data);
      if (cohortsRes.status === 'fulfilled') setCohorts(cohortsRes.value.data);
    } catch (e) {
      console.warn('Could not fetch modern features details:', e);
    }
  }

  function closeViewModal() {
    setIsViewModalOpen(false);
    setViewCourse(null);
  }

  // --- Form Modal Handlers ---
  function openCreateModal() {
    setEditingCourse(null);
    setForm({ name: '', teacherId: '', studentIds: [] });
    setIsFormModalOpen(true);
  }

  function openEditModal(course) {
    setEditingCourse(course);
    setForm({
      name: course.name || '',
      teacherId: course.teacherId || '',
      studentIds: (course.studentIds || []).map(Number),
    });
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
    }
    setIsFormModalOpen(true);
  }

  function closeFormModal() {
    setIsFormModalOpen(false);
    setEditingCourse(null);
  }

  function toggleStudent(studentId) {
    const current = new Set(form.studentIds || []);
    if (current.has(studentId)) {
      current.delete(studentId);
    } else {
      current.add(studentId);
    }
    setForm({ ...form, studentIds: Array.from(current) });
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast(t('courses.nameRequired'), 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      teacherId: form.teacherId ? Number(form.teacherId) : null,
      studentIds: (form.studentIds || []).map(Number),
    };

    try {
      if (editingCourse) {
        await apiClient.put(`/courses/${editingCourse.id}`, payload);
        addToast(t('courses.updatedToast', { name: payload.name }), 'success');
      } else {
        await apiClient.post('/courses', payload);
        addToast(t('courses.createdToast', { name: payload.name }), 'success');
      }
      closeFormModal();
      fetchAll();
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  }

  async function removeCourse(c) {
    if (!window.confirm(t('courses.deleteConfirm', { name: c.name }))) return;
    try {
      await apiClient.delete(`/courses/${c.id}`);
      addToast(t('courses.deletedToast', { name: c.name }), 'info');
      fetchAll();
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  }

  return (
    <div className="glass-card">
      {/* Header with Title and Create Button */}
      <div className="glass-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h2 className="glass-card-title d-flex align-items-center gap-2 mb-0">
          <span>{t('courses.title')}</span>
          <span className="badge-glow-indigo">{t('courses.activeCourses', { count: courses.length })}</span>
        </h2>
        <div>
          <button
            className="btn-modern-primary"
            onClick={openCreateModal}
            id="btn-open-create-course"
          >
            {t('courses.newBtn')}
          </button>
        </div>
      </div>

      {/* Courses List */}
      <div>
        {loading ? (
          <div className="text-center py-4 text-muted">{t('courses.loading')}</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-5 text-muted">{t('courses.noCourses')}</div>
        ) : (
          courses.map(c => {
            const teacher = personById(c.teacherId);
            const studentCount = (c.studentIds || []).length;

            return (
              <div key={c.id} className="glass-list-item">
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#f8fafc' }}>
                      {c.name}
                    </span>
                    <span className="badge-glow-indigo">{t('common.id')}: {c.id}</span>
                  </div>

                  <div className="d-flex flex-wrap gap-3 small text-muted">
                    <div>
                      {t('courses.teacherLabel')}{' '}
                      <strong className="text-light">
                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : t('courses.noTeacher')}
                      </strong>
                    </div>
                    <div>
                      {t('courses.studentsLabel')}{' '}
                      <strong className="text-cyan">
                        {t('courses.enrolledCount', { count: studentCount })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn-modern-cyan"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    onClick={() => openViewModal(c)}
                    aria-label={`${t('courses.viewBtn')} ${c.name}`}
                  >
                    {t('courses.viewBtn')}
                  </button>
                  <button
                    className="btn-modern-outline"
                    onClick={() => openEditModal(c)}
                    aria-label={`${t('courses.editBtn')} ${c.name}`}
                  >
                    {t('courses.editBtn')}
                  </button>
                  <button
                    className="btn-modern-danger"
                    onClick={() => removeCourse(c)}
                    aria-label={`${t('common.delete')} ${c.name}`}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. VIEW MODAL (Read-only inspection & Java 25 features) */}
      {isViewModalOpen && viewCourse && (
        <div className="modal-backdrop-custom" onClick={closeViewModal} role="dialog" aria-modal="true">
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <span className="brand-pill me-2">{t('courses.title')} #{viewCourse.id}</span>
                <h4 style={{ margin: '0.35rem 0 0 0', fontWeight: 700, color: '#f8fafc' }}>
                  {t('courses.viewModalTitle', { name: viewCourse.name })}
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

            {/* Course Overview Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <div className="small text-dim mb-1">{t('courses.assignedTeacher')}</div>
                  {personById(viewCourse.teacherId) ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {personById(viewCourse.teacherId).firstName} {personById(viewCourse.teacherId).lastName}
                      </div>
                      <div className="small text-muted">{personById(viewCourse.teacherId).email}</div>
                    </div>
                  ) : (
                    <div className="text-muted fst-italic">{t('courses.noTeacher')}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <div className="small text-dim mb-1">{t('courses.studentsLabel')}</div>
                  <div style={{ fontWeight: 600, color: '#06b6d4' }}>
                    {t('courses.enrolledCount', { count: (viewCourse.studentIds || []).length })}
                  </div>
                  <div className="small text-muted">{t('courses.validatedByJava25')}</div>
                </div>
              </div>
            </div>

            {/* Enrolled Students List */}
            <div className="mb-4">
              <div className="small text-dim mb-2">{t('courses.enrolledStudents', { count: (viewCourse.studentIds || []).length })}</div>
              <div style={{ maxHeight: 130, overflowY: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 12px' }}>
                {(viewCourse.studentIds || []).length === 0 ? (
                  <div className="text-muted small fst-italic">{t('courses.noStudentsAvailable')}</div>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {(viewCourse.studentIds || []).map(id => {
                      const student = personById(id);
                      return (
                        <span key={id} className="badge-role student" style={{ padding: '4px 10px' }}>
                          {student ? `${student.firstName} ${student.lastName}` : `#${id}`}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Java 25 Modern Features Callout */}
            <div className="mb-4 p-3 rounded" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="brand-pill">{t('courses.previewFeaturesTitle')}</span>
                <span className="small text-muted">{t('courses.previewFeaturesSub')}</span>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="small text-dim">{t('courses.firstStudent')}</div>
                    <div className="small font-monospace text-emerald">
                      {firstStudent ? `${firstStudent.firstName} ${firstStudent.lastName}` : t('courses.noneYet')}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="small text-dim">{t('courses.lastStudent')}</div>
                    <div className="small font-monospace text-emerald">
                      {lastStudent ? `${lastStudent.firstName} ${lastStudent.lastName}` : t('courses.noneYet')}
                    </div>
                  </div>
                </div>
              </div>

              {cohorts.length > 0 && (
                <div>
                  <div className="small text-dim mb-1">{t('courses.cohortsLabel')}</div>
                  <div className="cohort-pill-group">
                    {cohorts.map((cohort, idx) => (
                      <span key={idx} className="cohort-chip">
                        {t('courses.cohortGroup', {
                          group: idx + 1,
                          students: cohort.map(id => {
                            const s = personById(id);
                            return s ? s.firstName : `#${id}`;
                          }).join(', ')
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* View Modal Footer Actions */}
            <div className="d-flex justify-content-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn-modern-secondary" onClick={closeViewModal}>
                {t('common.close')}
              </button>
              <button
                type="button"
                className="btn-modern-primary"
                onClick={() => openEditModal(viewCourse)}
              >
                {t('courses.editBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FORM MODAL (Create or Edit Course) */}
      {isFormModalOpen && (
        <div className="modal-backdrop-custom" onClick={closeFormModal} role="dialog" aria-modal="true">
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
                {editingCourse
                  ? t('courses.editModalTitle', { name: editingCourse.name })
                  : t('courses.createModalTitle')}
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
                <label className="form-label text-muted small">{t('courses.courseName')}</label>
                <input
                  className="form-control modern-input"
                  placeholder={t('courses.courseNamePlaceholder')}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted small" htmlFor="modal-teacher-select">
                  {t('courses.assignedTeacher')}
                </label>
                <select
                  id="modal-teacher-select"
                  className="form-select modern-select"
                  value={form.teacherId || ''}
                  onChange={e => setForm({ ...form, teacherId: e.target.value })}
                >
                  <option value="">{t('courses.selectTeacherDefault')}</option>
                  {teachers.map(tItem => (
                    <option key={tItem.id} value={tItem.id}>
                      {tItem.firstName} {tItem.lastName} ({tItem.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label text-muted small d-flex justify-content-between">
                  <span>{t('courses.enrolledStudents', { count: form.studentIds.length })}</span>
                  <span className="text-dim">{t('courses.validatedByJava25')}</span>
                </label>
                <div style={{ maxHeight: 180, overflowY: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12 }}>
                  {students.length === 0 ? (
                    <div className="text-dim small">{t('courses.noStudentsAvailable')}</div>
                  ) : (
                    <div className="row g-2">
                      {students.map(s => (
                        <div key={s.id} className="col-md-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={(form.studentIds || []).includes(s.id)}
                              onChange={() => toggleStudent(s.id)}
                              id={`modal-student-check-${s.id}`}
                            />
                            <label className="form-check-label text-truncate" htmlFor={`modal-student-check-${s.id}`} style={{ fontSize: '0.88rem' }}>
                              {s.firstName} {s.lastName}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn-modern-secondary" onClick={closeFormModal}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-modern-primary">
                  {editingCourse ? t('courses.saveChanges') : t('courses.createCourse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
