import React, { useState } from 'react';
import { apiClient, extractErrorMessage } from '../api';
import { useToast } from '../ToastContext';
import { useI18n } from '../i18n/I18nContext';
import { useCourses } from './hooks/useCourses';
import CourseFormModal from './components/CourseFormModal';
import CourseViewModal from './components/CourseViewModal';

export default function CourseCrud() {
  const { t } = useI18n();
  const { addToast } = useToast();

  const {
    courses,
    teachers,
    students,
    loading,
    fetchAll,
    personById,
  } = useCourses();

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCourse, setViewCourse] = useState(null);

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  function openViewModal(course) {
    setViewCourse(course);
    setIsViewModalOpen(true);
  }

  function openCreateModal() {
    setEditingCourse(null);
    setIsFormModalOpen(true);
  }

  function openEditModal(course) {
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
    }
    setEditingCourse(course);
    setIsFormModalOpen(true);
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

      {/* View Modal */}
      <CourseViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        course={viewCourse}
        personById={personById}
        onEditClick={openEditModal}
      />

      {/* Form Modal (Create or Edit) */}
      <CourseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingCourse={editingCourse}
        teachers={teachers}
        students={students}
        onSuccess={fetchAll}
      />
    </div>
  );
}
