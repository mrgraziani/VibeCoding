import { extractErrorMessage, API_BASE_URL } from '../api';

describe('api helper & extractErrorMessage', () => {
  test('returns default API base URL', () => {
    expect(API_BASE_URL).toBeDefined();
  });

  test('extracts error from response.data.error', () => {
    const err = { response: { data: { error: 'Invalid email domain' } } };
    expect(extractErrorMessage(err)).toBe('Invalid email domain');
  });

  test('extracts error from response.data.message', () => {
    const err = { response: { data: { message: 'Entity not found' } } };
    expect(extractErrorMessage(err)).toBe('Entity not found');
  });

  test('extracts validation errors array from response.data.errors', () => {
    const err = {
      response: {
        data: {
          errors: [
            { defaultMessage: 'First name is required' },
            { defaultMessage: 'Email is required' },
          ],
        },
      },
    };
    expect(extractErrorMessage(err)).toBe('First name is required, Email is required');
  });

  test('extracts string response data', () => {
    const err = { response: { data: 'Direct string error' } };
    expect(extractErrorMessage(err)).toBe('Direct string error');
  });

  test('extracts error.message if no response data', () => {
    const err = new Error('Network timeout');
    expect(extractErrorMessage(err)).toBe('Network timeout');
  });

  test('fallback when error is null or empty', () => {
    expect(extractErrorMessage(null)).toBe('Error desconocido');
    expect(extractErrorMessage({})).toBe('No se pudo comunicar con el servidor backend');
  });
});
