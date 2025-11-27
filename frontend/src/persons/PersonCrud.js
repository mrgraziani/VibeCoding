import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export default function PersonCrud({ filterType }) {
  const [persons, setPersons] = useState([]);
  const [form, setForm] = useState({ id: null, firstName: '', lastName: '', email: '', personType: '' });

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() {
    axios.get(`${API}/persons`).then(r => {
      const list = r.data;
      if (filterType === 'STUDENT') setPersons(list.filter(p => p.personType === 'STUDENT'));
      else if (filterType === 'TEACHER') setPersons(list.filter(p => p.personType === 'TEACHER'));
      else setPersons(list);
    }).catch(console.error);
  }

  function submit(e) {
    e.preventDefault();
    if (form.id) {
      axios.put(`${API}/persons/${form.id}`, form).then(() => { resetForm(); fetchAll(); }).catch(console.error);
    } else {
      axios.post(`${API}/persons`, form).then(() => { resetForm(); fetchAll(); }).catch(console.error);
    }
  }

  function edit(p) {
    setForm({ id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.email, personType: p.personType });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(id) {
    axios.delete(`${API}/persons/${id}`).then(() => fetchAll()).catch(console.error);
  }

  function resetForm() {
    setForm({ id: null, firstName: '', lastName: '', email: '', personType: '' });
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">{filterType === 'TEACHER' ? 'Teachers' : filterType === 'STUDENT' ? 'Students' : 'Persons'}</h2>

        <form onSubmit={submit} className="row g-2 align-items-center mb-3">
          <div className="col-auto"><input className="form-control" placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
          <div className="col-auto"><input className="form-control" placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          <div className="col-auto"><input className="form-control" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="col-auto">
            <select className="form-select" value={form.personType || ''} onChange={e => setForm({ ...form, personType: e.target.value })}>
              <option value="">Person</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>
          <div className="col-auto"><button className="btn btn-primary" type="submit">{form.id ? 'Update' : 'Create'}</button></div>
          <div className="col-auto"><button className="btn btn-secondary" type="button" onClick={resetForm}>Clear</button></div>
        </form>

        <ul className="list-group">
          {persons.map(p => (
            <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div>{p.firstName} {p.lastName} <small className="text-muted">{p.email}</small></div>
                <div><small className="text-muted">{p.personType}</small></div>
              </div>
              <div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => edit(p)}>Edit</button>
                <button className="btn btn-sm btn-danger ms-2" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
