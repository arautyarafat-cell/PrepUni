// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { Container, ListGroup, ProgressBar } from 'react-bootstrap';
import { API_BASE_URL } from '../config/apiConfig';

function DashboardPage() {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/enrollments/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(setEnrollments)
      .catch(() => setEnrollments([]));
  }, []);

  return (
    <Container className="mt-4">
      <h2>Meu painel</h2>
      <h4 className="mt-3">Cursos inscritos</h4>
      <ListGroup>
        {enrollments.map(item => (
          <ListGroup.Item key={item.id}>
            {item.course_title}
            <ProgressBar now={item.progress || 0} label={`${item.progress || 0}%`} className="mt-2" />
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
}

export default DashboardPage;
