import React, { useState } from 'react';
import PersonCrud from './persons/PersonCrud';
import CourseCrud from './courses/CourseCrud';

function Teachers() {
  return <PersonCrud filterType="TEACHER" />;
}

function Students() {
  return <PersonCrud filterType="STUDENT" />;
}

export default function App() {
  const [page, setPage] = useState('students');

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">PersonCrud</a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('students')}>Students</button></li>
              <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('teachers')}>Teachers</button></li>
              <li className="nav-item"><button className="btn btn-link nav-link" onClick={() => setPage('courses')}>Courses</button></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container">
        {page === 'students' && <Students />}
        {page === 'teachers' && <Teachers />}
        {page === 'courses' && <CourseCrud />}
      </div>
    </div>
  );
}
