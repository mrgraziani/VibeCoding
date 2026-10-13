import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CourseCrud from '../courses/CourseCrud';
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

describe('CourseCrud Component', () => {
  const mockPersons = [
    { id: 10, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@math.edu', personType: 'TEACHER' },
    { id: 20, firstName: 'Alan', lastName: 'Turing', email: 'alan@math.edu', personType: 'STUDENT' },
  ];

  const mockCourses = [
    { id: 100, name: 'Computer Architecture', teacherId: 10, studentIds: [20] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get.mockImplementation(url => {
      if (url === '/courses') return Promise.resolve({ data: mockCourses });
      if (url === '/persons') return Promise.resolve({ data: mockPersons });
      if (url.includes('/students/first')) {
        return Promise.resolve({ data: { id: 20, firstName: 'Alan', lastName: 'Turing' } });
      }
      if (url.includes('/students/last')) {
        return Promise.resolve({ data: { id: 20, firstName: 'Alan', lastName: 'Turing' } });
      }
      if (url.includes('/cohorts')) {
        return Promise.resolve({ data: [[20]] });
      }
      return Promise.resolve({ data: {} });
    });
    apiClient.post.mockResolvedValue({ data: { id: 101, name: 'Modern Java 25', teacherId: 10, studentIds: [20] } });
    apiClient.put.mockResolvedValue({ data: { id: 100, name: 'Architecture Advanced', teacherId: 10, studentIds: [20] } });
    apiClient.delete.mockResolvedValue({ data: null });
  });

  test('renders courses list with teacher and student count', async () => {
    render(
      <ToastProvider>
        <CourseCrud />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computer Architecture')).toBeInTheDocument();
    });
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/1 enrolled/i)).toBeInTheDocument();
  });

  test('creates a new course via modal with selected teacher and student', async () => {
    render(
      <ToastProvider>
        <CourseCrud />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computer Architecture')).toBeInTheDocument();
    });

    // Open Create Course modal
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Course/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e\.g\. Distributed Systems/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Distributed Systems/i), {
      target: { value: 'Modern Java 25' },
    });

    const teacherSelect = screen.getByLabelText(/Assigned Teacher/i);
    fireEvent.change(teacherSelect, { target: { value: '10' } });

    // Toggle student checkbox (loaded async)
    const studentCheckbox = await screen.findByLabelText(/Alan Turing/i);
    fireEvent.click(studentCheckbox);

    // Submit in modal
    fireEvent.click(screen.getByRole('button', { name: /^Create Course$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/courses', {
        name: 'Modern Java 25',
        teacherId: 10,
        studentIds: [20],
      });
    });
  });

  test('opens view modal and then switches to edit modal to submit changes', async () => {
    render(
      <ToastProvider>
        <CourseCrud />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computer Architecture')).toBeInTheDocument();
    });

    // Open view modal
    fireEvent.click(screen.getByRole('button', { name: /Details & Java 25/i }));

    await waitFor(() => {
      expect(screen.getByText(/Course Details: Computer Architecture/i)).toBeInTheDocument();
      expect(screen.getByText('Java 25 Preview Features')).toBeInTheDocument();
    });

    // Switch to edit modal from view modal
    const editBtns = screen.getAllByRole('button', { name: /Edit Course/i });
    fireEvent.click(editBtns[editBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Computer Architecture')).toBeInTheDocument();
    });

    // Save changes in edit modal
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith('/courses/100', expect.objectContaining({
        name: 'Computer Architecture',
        teacherId: 10,
      }));
    });
  });

  test('deletes a course after user confirmation', async () => {
    window.confirm = jest.fn(() => true);

    render(
      <ToastProvider>
        <CourseCrud />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Computer Architecture')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/courses/100');
    });
  });
});
