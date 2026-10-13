import axios from 'axios';

// Detect whether running in dev mode or containerized / production Nginx
const DEFAULT_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '3000'
    ? 'http://localhost:8080/api'
    : '/api');

export const API_BASE_URL = DEFAULT_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * Parses and extracts human-readable error messages from Spring Boot backend responses.
 * Avoids "[object Object]" artifacts from Spring's JSON error objects.
 */
export function extractErrorMessage(err) {
  if (!err) return 'Error desconocido';
  if (err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'object') {
      if (data.error) return String(data.error);
      if (data.message) return String(data.message);
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map(e => e.defaultMessage || e.message || JSON.stringify(e)).join(', ');
      }
      return JSON.stringify(data);
    }
    if (typeof data === 'string' && data.trim()) return data;
  }
  if (err.message) return err.message;
  return 'No se pudo comunicar con el servidor backend';
}
