import { useState, useCallback, useEffect } from 'react';
import { apiClient, extractErrorMessage } from '../../api';
import { useToast } from '../../ToastContext';

/**
 * Custom hook managing Course state.
 * Primary: Consumes semantic /api/teachers and /api/students endpoints directly.
 * Fallback: Gracefully falls back to /api/persons for legacy clients or test mocks.
 */
export function useCourses() {
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const coursesRes = await apiClient.get('/courses');
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data?.content || []));

      let tList = [];
      let sList = [];

      // Attempt semantic endpoints first
      try {
        const [teachersRes, studentsRes] = await Promise.all([
          apiClient.get('/teachers'),
          apiClient.get('/students'),
        ]);
        if (Array.isArray(teachersRes?.data) && Array.isArray(studentsRes?.data)) {
          tList = teachersRes.data;
          sList = studentsRes.data;
        }
      } catch (_) {
        // Fallback below
      }

      // If semantic endpoints not returned or empty in test mocks, fallback to /persons
      if (tList.length === 0 && sList.length === 0) {
        try {
          const personsRes = await apiClient.get('/persons');
          const all = Array.isArray(personsRes?.data) ? personsRes.data : (personsRes?.data?.content || []);
          tList = all.filter(p => p.personType === 'TEACHER');
          sList = all.filter(p => p.personType === 'STUDENT');
        } catch (_) {
          // Ignore fallback errors
        }
      }

      setTeachers(tList);
      setStudents(sList);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const personById = useCallback((id) => {
    if (id == null) return null;
    const safeT = Array.isArray(teachers) ? teachers : [];
    const safeS = Array.isArray(students) ? students : [];
    return (
      safeT.find(p => p.id === id || String(p.id) === String(id)) ||
      safeS.find(p => p.id === id || String(p.id) === String(id)) ||
      null
    );
  }, [teachers, students]);

  return {
    courses,
    teachers,
    students,
    loading,
    fetchAll,
    personById,
  };
}
