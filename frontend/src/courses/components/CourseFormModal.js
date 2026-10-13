import React, { useState, useEffect } from 'react';
import { apiClient, extractErrorMessage } from '../../api';
import { useToast } from '../../ToastContext';
import { useI18n } from '../../i18n/I18nContext';

export default function CourseFormModal({
  isOpen,
  onClose,
  editingCourse,
  teachers,
  students,
  onSuccess,
}) {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', teacherId: '', studentIds: [] });

  useEffect(() => {
    if (editingCourse) {
      setForm({
        name: editingCourse.name || '',
        teacherId: editingCourse.teacherId || '',
        studentIds: (editingCourse.studentIds || []).map(Number),
      });
    } else {
      setForm({ name: '', teacherId: '', studentIds: [] });
    }
  }, [editingCourse, isOpen]);

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

  if (!isOpen) return null;

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

    setSubmitting(true);
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
      onSuccess();
      onClose();
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-form-modal-title"
    >
      <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
        <div
          className="d-flex justify-content-between align-items-center mb-3 pb-2"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h4 id="course-form-modal-title" style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
            {editingCourse
              ? t('courses.editModalTitle', { name: editingCourse.name })
              : t('courses.createModalTitle')}
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
            <label htmlFor="course-name-input" className="form-label text-muted small">
              {t('courses.courseName')}
            </label>
            <input
              id="course-name-input"
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
            <label htmlFor="modal-teacher-select" className="form-label text-muted small">
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
            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: 12,
              }}
            >
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
                        <label
                          className="form-check-label text-truncate"
                          htmlFor={`modal-student-check-${s.id}`}
                          style={{ fontSize: '0.88rem' }}
                        >
                          {s.firstName} {s.lastName}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                : editingCourse
                ? t('courses.saveChanges')
                : t('courses.createCourse')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
