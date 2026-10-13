import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonCrud from '../persons/PersonCrud';
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

describe('PersonCrud Component', () => {
  const mockPersons = [
    { id: 1, firstName: 'Alan', lastName: 'Turing', email: 'alan@test.com', personType: 'STUDENT' },
    { id: 2, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@test.com', personType: 'TEACHER' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockImplementation(url => {
      if (url === '/courses') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockPersons });
    });
    apiClient.post.mockResolvedValue({ data: { id: 3, firstName: 'Grace', lastName: 'Hopper', email: 'grace@test.com', personType: 'STUDENT' } });
    apiClient.put.mockResolvedValue({ data: { id: 1, firstName: 'Alan', lastName: 'Turing Updated', email: 'alan@test.com', personType: 'STUDENT' } });
    apiClient.delete.mockResolvedValue({ data: null });
  });

  test('renders student list filtered by STUDENT type', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
      expect(screen.getAllByText('Student').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.queryByText('STUDENT')).not.toBeInTheDocument();
  });

  test('renders teacher list filtered by TEACHER type', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="TEACHER" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getAllByText('Teacher').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Alan Turing')).not.toBeInTheDocument();
    expect(screen.queryByText('TEACHER')).not.toBeInTheDocument();
  });

  test('submits form in modal to create a new student', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    // Open Create Modal
    fireEvent.click(screen.getByRole('button', { name: /\+ New Student|Create Student/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Ada')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Ada'), { target: { value: 'Grace' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Lovelace'), { target: { value: 'Hopper' } });
    fireEvent.change(screen.getByPlaceholderText('ada@example.com'), { target: { value: 'grace@navy.edu' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Student/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/persons', {
        id: null,
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@navy.edu',
        personType: 'STUDENT',
      });
    });
  });

  test('validates required fields before submitting in modal', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    // Open Create Modal
    fireEvent.click(screen.getByRole('button', { name: /\+ New Student|Create Student/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Ada')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Ada'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Student/i }));

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  test('opens profile view modal for a student', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /View Profile/i }));

    await waitFor(() => {
      expect(screen.getByText(/Student Profile: Alan Turing/i)).toBeInTheDocument();
      expect(screen.getAllByText('alan@test.com').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('edits an existing student in modal and submits update', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    // Form modal inputs should be filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('Alan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Turing')).toBeInTheDocument();
    });

    // Click Update
    fireEvent.click(screen.getByRole('button', { name: /Update Student/i }));

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/persons/1', expect.objectContaining({
        id: 1,
        firstName: 'Alan',
        lastName: 'Turing',
      }));
    });
  });

  test('cancels edit modal', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByPlaceholderText('e.g. Ada')).not.toBeInTheDocument();
  });

  test('searches persons by last name and clears search', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search by last name...');
    fireEvent.change(searchInput, { target: { value: 'Turing' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/persons/search?lastName=Turing');
    });

    // Clear search
    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/persons');
    });
  });

  test('searches teachers by last name prefix (LIKE search)', async () => {
    apiClient.get.mockImplementation(url => {
      if (url.includes('/persons/search?lastName=Love')) {
        return Promise.resolve({
          data: [
            { id: 10, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', personType: 'TEACHER' },
            { id: 11, firstName: 'Sam', lastName: 'Lovering', email: 'sam@example.com', personType: 'STUDENT' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ToastProvider>
        <PersonCrud filterType="TEACHER" />
      </ToastProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search by last name...');
    fireEvent.change(searchInput, { target: { value: 'Love' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/persons/search?lastName=Love');
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.queryByText('Sam Lovering')).not.toBeInTheDocument();
    });
  });

  test('deletes a person after confirmation', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/persons/1');
    });
  });

  test('closes form modal on Escape key press', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ New Student|Create Student/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Ada')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('e.g. Ada')).not.toBeInTheDocument();
    });
  });

  test('closes view modal on Escape key press', async () => {
    render(
      <ToastProvider>
        <PersonCrud filterType="STUDENT" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /View Profile/i }));
    await waitFor(() => {
      expect(screen.getByText(/Student Profile: Alan Turing/i)).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText(/Student Profile: Alan Turing/i)).not.toBeInTheDocument();
    });
  });
});

