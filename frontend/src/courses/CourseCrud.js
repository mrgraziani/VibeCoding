import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export default function CourseCrud() {
  const [courses, setCourses] = useState([]);
  const [persons, setPersons] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', teacherId: '', studentIds: [] });
  const [error, setError] = useState(null);

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCourse, setModalCourse] = useState(null);
  const [modalForm, setModalForm] = useState({ id: null, name: '', teacherId: '', studentIds: [] });

  useEffect(() => { fetchAll(); fetchPersons(); }, []);

  function fetchAll() {
    axios.get(`${API}/courses`).then(r => setCourses(r.data)).catch(e => setError(e.toString()));
  }

  function fetchPersons() {
    axios.get(`${API}/persons`).then(r => setPersons(r.data)).catch(e => setError(e.toString()));
  }

  function submit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      teacherId: form.teacherId || null,
      studentIds: form.studentIds || []
    };

    if (form.id) {
      axios.put(`${API}/courses/${form.id}`, payload)
        .then(() => { resetForm(); fetchAll(); })
        .catch(err => setError(err?.response?.data || err.message));
    } else {
      axios.post(`${API}/courses`, payload)
        .then(() => { resetForm(); fetchAll(); })
        .catch(err => setError(err?.response?.data || err.message));
    }
  }

  function edit(c) {
    // open modal for editing with full details fetched
    viewCourse(c.id, true);
  }

  function remove(id) {
    if (!window.confirm('Delete course?')) return;
    axios.delete(`${API}/courses/${id}`).then(() => fetchAll()).catch(e => setError(e.toString()));
  }

  function toggleStudent(studentId) {
    const set = new Set(form.studentIds || []);
    if (set.has(studentId)) set.delete(studentId); else set.add(studentId);
    setForm({ ...form, studentIds: Array.from(set) });
  }

  function resetForm() {
    setForm({ id: null, name: '', teacherId: '', studentIds: [] });
    setError(null);
  }

  // View course details and optionally open modal for edit
  function viewCourse(id, openForEdit = false) {
    axios.get(`${API}/courses/${id}`).then(r => {
      const c = r.data; // CourseDto: { id, name, teacherId, studentIds }
      setModalCourse(c);
      setModalForm({
        id: c.id,
        name: c.name || '',
        teacherId: c.teacherId || '',
        studentIds: (c.studentIds || []).map(Number)
      });
      setModalVisible(true);
    }).catch(e => setError(e.toString()));
  }

  function closeModal() {
    setModalVisible(false);
    setModalCourse(null);
  }

  function submitModal(e) {
    e.preventDefault();
    const payload = {
      name: modalForm.name,
      teacherId: modalForm.teacherId || null,
      studentIds: modalForm.studentIds || []
    };
    axios.put(`${API}/courses/${modalForm.id}`, payload)
      .then(() => { closeModal(); fetchAll(); })
      .catch(err => setError(err?.response?.data || err.message));
  }

  function toggleModalStudent(studentId) {
    const set = new Set(modalForm.studentIds || []);
    if (set.has(studentId)) set.delete(studentId); else set.add(studentId);
    setModalForm({ ...modalForm, studentIds: Array.from(set) });
  }

  // helper to resolve person by id
  function personById(id) {
    if (id == null) return null;
    return persons.find(p => p.id === id || String(p.id) === String(id)) || null;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Courses</h2>

        <form onSubmit={submit} className="mb-3">
          <div className="mb-2">
            <input className="form-control" placeholder="Course name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="mb-2">
            <label className="form-label">Teacher</label>
            <select className="form-select" value={form.teacherId || ''} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">-- select teacher --</option>
              {persons.filter(p => p.personType === 'TEACHER').map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="form-label">Students</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
              {persons.filter(p => p.personType === 'STUDENT').map(p => (
                <div key={p.id} className="form-check">
                  <input className="form-check-input" type="checkbox" checked={(form.studentIds || []).includes(p.id)} onChange={() => toggleStudent(p.id)} id={`s-${p.id}`} />
                  <label className="form-check-label" htmlFor={`s-${p.id}`}>{p.firstName} {p.lastName}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <button className="btn btn-primary" type="submit">{form.id ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary ms-2" type="button" onClick={resetForm}>Clear</button>
          </div>
          {error && <div className="text-danger">{String(error)}</div>}
        </form>

        <ul className="list-group">
          {courses.map(c => {
            const teacher = personById(c.teacherId);
            const studentsText = (c.studentIds || []).map(id => {
              const s = personById(id);
              return s ? `${s.firstName} ${s.lastName}` : `#${id}`;
            }).join(', ');

            return (
              <li key={c.id} className="list-group-item">
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>{c.name}</strong>
                    <div className="text-muted">Teacher: {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'n/a'}</div>
                    <div className="text-muted">Students: {studentsText || 'n/a'}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => viewCourse(c.id, false)}>View</button>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => edit(c)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Delete</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modal */}
      {modalVisible && modalCourse && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Course Details - {modalCourse.name}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <h6>Teacher</h6>
                <div>{(() => {
                  const t = personById(modalCourse.teacherId);
                  return t ? `${t.firstName} ${t.lastName} (${t.email})` : 'n/a';
                })()}</div>

                <hr />
                <h6>Students</h6>
                <ul>
                  {(modalCourse.studentIds || []).map(id => {
                    const s = personById(id);
                    return <li key={id}>{s ? `${s.firstName} ${s.lastName} ` : `#${id}`}<small className="text-muted">{s ? ` ${s.email}` : ''}</small></li>;
                  })}
                </ul>

                <hr />
                <h6>Edit in modal</h6>
                <form onSubmit={submitModal}>
                  <div className="mb-2">
                    <input className="form-control" value={modalForm.name} onChange={e => setModalForm({ ...modalForm, name: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Teacher</label>
                    <select className="form-select" value={modalForm.teacherId || ''} onChange={e => setModalForm({ ...modalForm, teacherId: e.target.value })}>
                      <option value="">-- select teacher --</option>
                      {persons.filter(p => p.personType === 'TEACHER').map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Students</label>
                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
                      {persons.filter(p => p.personType === 'STUDENT').map(p => (
                        <div key={p.id} className="form-check">
                          <input className="form-check-input" type="checkbox" checked={(modalForm.studentIds || []).includes(p.id)} onChange={() => toggleModalStudent(p.id)} id={`m-${p.id}`} />
                          <label className="form-check-label" htmlFor={`m-${p.id}`}>{p.firstName} {p.lastName}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-secondary me-2" type="button" onClick={closeModal}>Close</button>
                    <button className="btn btn-primary" type="submit">Save</button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
