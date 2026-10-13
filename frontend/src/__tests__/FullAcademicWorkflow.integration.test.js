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

describe('Full Academic Lifecycle Integration Test (React Testing Library)', () => {
  let personsDb = [];
  let coursesDb = [];
  let nextPersonId = 100;
  let nextCourseId = 500;

  beforeEach(() => {
    jest.clearAllMocks();
    personsDb = [];
    coursesDb = [];
    window.confirm = jest.fn(() => true);

    apiClient.get.mockImplementation(url => {
      if (url === '/persons') {
        return Promise.resolve({ data: [...personsDb] });
      }
      if (url.includes('/persons?')) {
        return Promise.resolve({ data: [...personsDb] });
      }
      if (url === '/teachers') {
        return Promise.resolve({ data: personsDb.filter(p => p.personType === 'TEACHER') });
      }
      if (url === '/students') {
        return Promise.resolve({ data: personsDb.filter(p => p.personType === 'STUDENT') });
      }
      if (url === '/courses') {
        return Promise.resolve({ data: [...coursesDb] });
      }
      return Promise.resolve({ data: [] });
    });

    apiClient.post.mockImplementation((url, payload) => {
      if (url === '/persons') {
        const created = { ...payload, id: nextPersonId++ };
        personsDb.push(created);
        return Promise.resolve({ data: created });
      }
      if (url === '/courses') {
        const created = { ...payload, id: nextCourseId++ };
        coursesDb.push(created);
        return Promise.resolve({ data: created });
      }
      return Promise.resolve({ data: payload });
    });

    apiClient.put.mockImplementation((url, payload) => {
      if (url.startsWith('/persons/')) {
        const id = Number(url.replace('/persons/', ''));
        const idx = personsDb.findIndex(p => p.id === id);
        if (idx !== -1) {
          personsDb[idx] = { ...personsDb[idx], ...payload, id };
          return Promise.resolve({ data: personsDb[idx] });
        }
      }
      if (url.startsWith('/courses/')) {
        const id = Number(url.replace('/courses/', ''));
        const idx = coursesDb.findIndex(c => c.id === id);
        if (idx !== -1) {
          coursesDb[idx] = { ...coursesDb[idx], ...payload, id };
          return Promise.resolve({ data: coursesDb[idx] });
        }
      }
      return Promise.resolve({ data: payload });
    });

    apiClient.delete.mockImplementation(url => {
      if (url.startsWith('/courses/')) {
        const id = Number(url.replace('/courses/', ''));
        coursesDb = coursesDb.filter(c => c.id !== id);
        return Promise.resolve({ data: null });
      }
      if (url.startsWith('/persons/')) {
        const id = Number(url.replace('/persons/', ''));
        personsDb = personsDb.filter(p => p.id !== id);
        return Promise.resolve({ data: null });
      }
      return Promise.resolve({ data: null });
    });
  });

  test('executes complete end-to-end user journey: student -> teacher -> course -> enroll 2nd student -> change teacher -> delete all', async () => {
    localStorage.clear();
    render(<App />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Students' })).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 1. Create Student 1 (Ada Lovelace)
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: 'Students' }));
    fireEvent.click(screen.getByRole('button', { name: /New Student/i }));

    expect(screen.getByRole('heading', { name: /New Student/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^First Name$/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/^Last Name$/i), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'ada@computing.edu' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Student/i }));

    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 2. Create Teacher 1 (Donald Knuth)
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Teacher/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Teacher/i }));
    expect(screen.getByRole('heading', { name: /New Teacher/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^First Name$/i), { target: { value: 'Donald' } });
    fireEvent.change(screen.getByLabelText(/^Last Name$/i), { target: { value: 'Knuth' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'knuth@stanford.edu' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Teacher/i }));

    await waitFor(() => {
      expect(screen.getByText('Donald Knuth')).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 3. Create Course with Teacher 1 and Student 1
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Course/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Create Course/i }));
    expect(screen.getByRole('heading', { name: /Create New Course/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Course Name/i), {
      target: { value: 'The Art of Computer Programming' },
    });

    // Select Donald Knuth as teacher
    const teacherSelect = screen.getByLabelText(/Assigned Teacher/i);
    const donaldId = personsDb.find(p => p.firstName === 'Donald').id;
    fireEvent.change(teacherSelect, { target: { value: String(donaldId) } });

    // Check Ada Lovelace as enrolled student
    const adaCheck = screen.getByLabelText(/Ada Lovelace/i);
    fireEvent.click(adaCheck);
    expect(adaCheck.checked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /^Create Course$/i }));

    await waitFor(() => {
      expect(screen.getByText('The Art of Computer Programming')).toBeInTheDocument();
      expect(screen.getByText('Donald Knuth')).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 4. Create Student 2 (Grace Hopper) and Enroll in Course
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: 'Students' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Student/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Student/i }));
    fireEvent.change(screen.getByLabelText(/^First Name$/i), { target: { value: 'Grace' } });
    fireEvent.change(screen.getByLabelText(/^Last Name$/i), { target: { value: 'Hopper' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'grace@navy.mil' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Student/i }));

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    });

    // Back to Courses and edit course to add Grace Hopper
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    await waitFor(() => {
      expect(screen.getByText('The Art of Computer Programming')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit Course The Art of Computer Programming/i }));
    await waitFor(() => {
      expect(screen.getByText(/Edit Course:/i)).toBeInTheDocument();
    });

    const graceCheck = screen.getByLabelText(/Grace Hopper/i);
    fireEvent.click(graceCheck);
    expect(graceCheck.checked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/2 enrolled/i)).toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 5. Create Teacher 2 (Edsger Dijkstra) and Change Teacher in Course
    // -------------------------------------------------------------------------
    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Teacher/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /New Teacher/i }));
    fireEvent.change(screen.getByLabelText(/^First Name$/i), { target: { value: 'Edsger' } });
    fireEvent.change(screen.getByLabelText(/^Last Name$/i), { target: { value: 'Dijkstra' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'dijkstra@utexas.edu' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Teacher/i }));

    await waitFor(() => {
      expect(screen.getByText('Edsger Dijkstra')).toBeInTheDocument();
    });

    // Change course teacher to Edsger Dijkstra
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    await waitFor(() => {
      expect(screen.getByText('The Art of Computer Programming')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit Course The Art of Computer Programming/i }));
    await waitFor(() => {
      expect(screen.getByText(/Edit Course:/i)).toBeInTheDocument();
    });

    const edsgerId = personsDb.find(p => p.firstName === 'Edsger').id;
    const teacherSelectEdit = screen.getByLabelText(/Assigned Teacher/i);
    fireEvent.change(teacherSelectEdit, { target: { value: String(edsgerId) } });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Edsger Dijkstra')).toBeInTheDocument();
      expect(screen.queryByText('Donald Knuth')).not.toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 6. Delete Everything: Course -> Students -> Teachers
    // -------------------------------------------------------------------------
    // 6a. Delete Course
    fireEvent.click(screen.getByRole('button', { name: /Delete The Art of Computer Programming/i }));
    await waitFor(() => {
      expect(screen.queryByText('The Art of Computer Programming')).not.toBeInTheDocument();
    });

    // 6b. Delete Students
    fireEvent.click(screen.getByRole('button', { name: 'Students' }));
    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Ada/i }));
    await waitFor(() => {
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Grace/i }));
    await waitFor(() => {
      expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
    });

    // 6c. Delete Teachers
    fireEvent.click(screen.getByRole('button', { name: 'Teachers' }));
    await waitFor(() => {
      expect(screen.getByText('Donald Knuth')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Donald/i }));
    await waitFor(() => {
      expect(screen.queryByText('Donald Knuth')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Edsger/i }));
    await waitFor(() => {
      expect(screen.queryByText('Edsger Dijkstra')).not.toBeInTheDocument();
    });

    // -------------------------------------------------------------------------
    // 7. Verify Cleanup: Everything is Deleted
    // -------------------------------------------------------------------------
    expect(personsDb.length).toBe(0);
    expect(coursesDb.length).toBe(0);
  });
});
