import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api';
import { useI18n } from '../../i18n/I18nContext';

export default function CourseViewModal({
  isOpen,
  onClose,
  course,
  personById,
  onEditClick,
  canEdit = true,
}) {
  const { t } = useI18n();
  const [firstStudent, setFirstStudent] = useState(null);
  const [lastStudent, setLastStudent] = useState(null);
  const [cohorts, setCohorts] = useState([]);

  useEffect(() => {
    if (!isOpen || !course) return;

    let isCurrent = true;
    setFirstStudent(null);
    setLastStudent(null);
    setCohorts([]);

    async function loadModernFeatures() {
      try {
        const [firstRes, lastRes, cohortsRes] = await Promise.allSettled([
          apiClient.get(`/courses/${course.id}/students/first`),
          apiClient.get(`/courses/${course.id}/students/last`),
          apiClient.get(`/courses/${course.id}/cohorts?size=2`),
        ]);

        if (!isCurrent) return;
        if (firstRes.status === 'fulfilled') setFirstStudent(firstRes.value.data);
        if (lastRes.status === 'fulfilled') setLastStudent(lastRes.value.data);
        if (cohortsRes.status === 'fulfilled') setCohorts(cohortsRes.value.data);
      } catch (e) {
        console.warn('Could not fetch modern features details:', e);
      }
    }

    loadModernFeatures();

    return () => {
      isCurrent = false;
    };
  }, [isOpen, course]);

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

  if (!isOpen || !course) return null;

  const teacher = personById(course.teacherId);

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-view-modal-title"
    >
      <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
        <div
          className="d-flex justify-content-between align-items-center mb-3 pb-2"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div>
            <span className="brand-pill me-2">{t('courses.title')} #{course.id}</span>
            <h4
              id="course-view-modal-title"
              style={{ margin: '0.35rem 0 0 0', fontWeight: 700, color: '#f8fafc' }}
            >
              {t('courses.viewModalTitle', { name: course.name })}
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

        {/* Course Overview Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div
              className="p-3 rounded"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}
            >
              <div className="small text-dim mb-1">{t('courses.assignedTeacher')}</div>
              {teacher ? (
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                    {teacher.firstName} {teacher.lastName}
                  </div>
                  <div className="small text-muted">{teacher.email}</div>
                </div>
              ) : (
                <div className="text-muted fst-italic">{t('courses.noTeacher')}</div>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div
              className="p-3 rounded"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}
            >
              <div className="small text-dim mb-1">{t('courses.studentsLabel')}</div>
              <div style={{ fontWeight: 600, color: '#06b6d4' }}>
                {t('courses.enrolledCount', { count: (course.studentIds || []).length })}
              </div>
              <div className="small text-muted">{t('courses.validatedByJava25')}</div>
            </div>
          </div>
        </div>

        {/* Enrolled Students List */}
        <div className="mb-4">
          <div className="small text-dim mb-2">
            {t('courses.enrolledStudents', { count: (course.studentIds || []).length })}
          </div>
          <div
            style={{
              maxHeight: 130,
              overflowY: 'auto',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            {(course.studentIds || []).length === 0 ? (
              <div className="text-muted small fst-italic">{t('courses.noStudentsAvailable')}</div>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {(course.studentIds || []).map(id => {
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
        <div
          className="mb-4 p-3 rounded"
          style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
        >
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
                      }).join(', '),
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Modal Footer Actions */}
        <div
          className="d-flex justify-content-end gap-2 pt-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button type="button" className="btn-modern-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
          {canEdit && (
            <button
              type="button"
              className="btn-modern-primary"
              onClick={() => onEditClick(course)}
            >
              {t('courses.editBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
