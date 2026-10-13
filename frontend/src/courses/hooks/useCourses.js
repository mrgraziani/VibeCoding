import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient, extractErrorMessage } from '../../api';
import { useToast } from '../../ToastContext';

export function useCourses() {
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const teachers = useMemo(() => persons.filter(p => p.personType === 'TEACHER'), [persons]);
  const students = useMemo(() => persons.filter(p => p.personType === 'STUDENT'), [persons]);

  const personById = useCallback((id) => {
    if (id == null) return null;
    return persons.find(p => p.id === id || String(p.id) === String(id)) || null;
  }, [persons]);

  return {
    courses,
    persons,
    teachers,
    students,
    loading,
    fetchAll,
    personById,
  };
}
