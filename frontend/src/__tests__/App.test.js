import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { apiClient } from '../api';

jest.mock('../api', () => {
  const original = jest.requireActual('../api');
  return {
    ...original,
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockImplementation(url => {
      if (url.includes('/persons')) {
        return Promise.resolve({
          data: [
            { id: 1, firstName: 'Alan', lastName: 'Turing', email: 'alan@math.edu', personType: 'STUDENT' },
            { id: 2, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@computing.edu', personType: 'TEACHER' },
          ],
        });
      }
      if (url.includes('/courses')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/system/native-info')) {
        return Promise.resolve({
          data: {
            processId: 1234,
            nativeMemoryAddress: '0x1000',
            allocatedBytes: 32,
            sha256OffHeapDigest: 'abc',
            operatingSystem: 'macOS',
            osArch: 'aarch64',
          },
        });
      }
      if (url.includes('/courses/audit-log')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('renders top navigation and brand badge with default English locale', async () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByText('PersonCrud')).toBeInTheDocument();
    expect(screen.getByText('Java 25 Modern Stack')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Students' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Teachers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Java 25 Lab/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select language/i })).toBeInTheDocument();
  });

  test('switches tabs between Students, Teachers, Courses, and Java 25 Lab', async () => {
    localStorage.clear();
    render(<App />);

    // Default is Students
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Students/i })).toBeInTheDocument();
    });

    // Switch to Teachers
    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Teachers/i })).toBeInTheDocument();
    });

    // Switch to Courses
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Courses/i })).toBeInTheDocument();
    });

    // Switch to Java 25 Lab
    fireEvent.click(screen.getByRole('button', { name: /Java 25 Lab/i }));
    await waitFor(() => {
      expect(screen.getByText('Diagnostics of Modern Backend Capabilities')).toBeInTheDocument();
    });
  });

  test('switches language from English to French via language selector combo', async () => {
    localStorage.clear();
    render(<App />);

    expect(screen.getByRole('button', { name: 'Students' })).toBeInTheDocument();

    const select = screen.getByRole('combobox', { name: /Select language/i });
    expect(select.value).toBe('en');

    // Switch to French
    fireEvent.change(select, { target: { value: 'fr' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Étudiants' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Professeurs' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cours' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Étudiants/i })).toBeInTheDocument();
    });

    expect(localStorage.getItem('app_locale')).toBe('fr');
  });
});
