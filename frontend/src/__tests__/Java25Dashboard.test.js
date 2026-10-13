import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Java25Dashboard from '../system/Java25Dashboard';
import { ToastProvider } from '../ToastContext';
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

describe('Java25Dashboard Component', () => {
  const mockNativeDiagnostics = {
    processId: 45678,
    operatingSystem: 'Mac OS X',
    osArch: 'aarch64',
    nativeMemoryAddress: '0x6000034a8a00',
    allocatedBytes: 40,
    sha256OffHeapDigest: 'd5a8b792e4242637a892b0c1ffba0b36c49833a69766601662584cfb77626c92',
  };

  const mockVtResults = [
    { taskName: 'MatriculaBatch', threadName: 'VirtualThread[#45]/run', durationMs: 25 },
    { taskName: 'CalculoPromedios', threadName: 'VirtualThread[#46]/run', durationMs: 30 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockImplementation(url => {
      if (url.includes('/system/native-info')) {
        return Promise.resolve({ data: mockNativeDiagnostics });
      }
      if (url.includes('/courses/audit-log')) {
        return Promise.resolve({ data: ['[Audit 1] Student enrolled in course 1'] });
      }
      return Promise.resolve({ data: {} });
    });
    apiClient.post.mockResolvedValue({ data: mockVtResults });
  });

  test('renders native FFM metrics (off-heap memory address and PID)', async () => {
    render(
      <ToastProvider>
        <Java25Dashboard />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('PID 45678')).toBeInTheDocument();
      expect(screen.getByText('d5a8b792e4242637a892b0c1ffba0b36c49833a69766601662584cfb77626c92')).toBeInTheDocument();
    });
  });

  test('triggers virtual threads concurrent execution on button click', async () => {
    render(
      <ToastProvider>
        <Java25Dashboard />
      </ToastProvider>
    );

    const runBtn = screen.getByRole('button', { name: /Trigger Concurrent Tasks/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/system/virtual-threads/run',
        expect.any(Array)
      );
      expect(screen.getByText('VirtualThread[#45]/run')).toBeInTheDocument();
      expect(screen.getByText('VirtualThread[#46]/run')).toBeInTheDocument();
    });
  });
});
