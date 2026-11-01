import React, { useState, useEffect } from "react";
import { Container, Table, Alert, Button } from "react-bootstrap";
import { API_BASE_URL } from "../config/apiConfig";

export default function SenhaEsquecida() {
  const [dados, setDados] = useState([]);
  const [error, setError] = useState("");

  const carregarDados = () => {
    fetch(`${API_BASE_URL}/recuperar_senha`)
      .then((res) => res.json())
      .then((data) => setDados(Array.isArray(data) ? data : []))
      .catch(() => setError("Erro ao carregar dados."));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const eliminarRegistro = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/recuperar_senha/${id}`, {
        method: "DELETE",
      });
      carregarDados();
    } catch (err) {
      setError("Erro ao eliminar registro.");
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Pedidos de Recuperação de Senha</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {dados.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Número ou Email</th>
              <th>Sugestão de Nova Senha</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.numeroouemail}</td>
                <td>{item.sugerir_nova_senha}</td>
                <td>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => eliminarRegistro(item.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>Nenhum pedido de recuperação encontrado.</p>
      )}
    </Container>
  );
}
