import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient, extractErrorMessage } from '../../api';
import { useToast } from '../../ToastContext';
import { PERSON_ROLES } from '../constants';

export function usePersons(filterType) {
  const { addToast } = useToast();
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Request sequence counter to eliminate race conditions without changing apiClient signature
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPersons = useCallback(async (query = '') => {
    const currentRequestId = ++latestRequestIdRef.current;
    setLoading(true);

    try {
      let res;
      if (query && query.trim()) {
        const url = filterType
          ? `/persons/search?lastName=${encodeURIComponent(query.trim())}&personType=${encodeURIComponent(filterType)}`
          : `/persons/search?lastName=${encodeURIComponent(query.trim())}`;
        res = await apiClient.get(url);
      } else {
        res = await apiClient.get('/persons');
      }

      // Discard stale responses from earlier requests or unmounted components
      if (!isMountedRef.current || currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      const list = res.data || [];
      if (filterType === PERSON_ROLES.STUDENT) {
        setPersons(list.filter(p => p.personType === PERSON_ROLES.STUDENT));
      } else if (filterType === PERSON_ROLES.TEACHER) {
        setPersons(list.filter(p => p.personType === PERSON_ROLES.TEACHER));
      } else {
        setPersons(list);
      }
    } catch (err) {
      if (isMountedRef.current && currentRequestId === latestRequestIdRef.current) {
        addToast(extractErrorMessage(err), 'error');
      }
    } finally {
      if (isMountedRef.current && currentRequestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filterType, addToast]);

  useEffect(() => {
    fetchPersons(searchTerm);
  }, [filterType, fetchPersons]);

  const reload = useCallback(() => {
    return fetchPersons(searchTerm);
  }, [fetchPersons, searchTerm]);

  return {
    persons,
    loading,
    searchTerm,
    setSearchTerm,
    fetchPersons,
    reload,
  };
}
