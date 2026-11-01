import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Alert, Button } from "react-bootstrap";
import { FaUniversity, FaWhatsapp } from "react-icons/fa";
import { API_BASE_URL } from "../config/apiConfig";

export default function Banco() {
  const [dados, setDados] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/bna`)
      .then((res) => res.json())
      .then((data) => setDados(Array.isArray(data) ? data : []))
      .catch(() => setError("Erro ao carregar dados da tabela bna."));
  }, []);

  return (
    <Container className="mt-5">
      <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "10px" }}>
        Realize seu pagamento, através dos dados abaixo!
      </h2>
      <p style={{ fontSize: "1.2rem", color: "#555", marginBottom: "30px" }}>
        Realize sua transferência e envie o comprovativo via WhatsApp.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        {dados.length > 0 ? (
          dados.map((item, index) => (
            <Col xs={12} md={6} key={index} className="mb-4">
              <Card className="h-100 shadow-lg border-0" style={{ backgroundColor: "#fff", color: "#333" }}>
                <Card.Body>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                    <FaUniversity size={32} style={{ marginRight: "12px", color: "#006400" }} />
                    <Card.Title style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Dados Bancários</Card.Title>
                  </div>
                  <Card.Text style={{ fontFamily: "monospace", fontSize: "1.3rem", marginBottom: "20px" }}>
                    <strong>Express:</strong> {item.express} <br />
                    <strong>IBAN:</strong> {item.iban}
                  </Card.Text>
                  <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
                    Após realizar a transferência, envie o comprovativo via WhatsApp junto com:
                    <br />• Seu <strong>nome de usuário</strong>
                    <br />• O <strong>curso</strong> que pretende comprar
                  </p>

                  {/* Botão WhatsApp */}
                  <Button
                    variant="success"
                    className="mt-4 w-100"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", padding: "12px" }}
                    onClick={() =>
                      window.open(
                        "https://wa.me/244932134493?text=Olá,%20segue%20meu%20comprovativo%20de%20transferência%20para%20o%20curso...",
                        "_blank"
                      )
                    }
                  >
                    <FaWhatsapp size={26} style={{ marginRight: "10px" }} /> Enviar Comprovativo
                  </Button>

                  {/* Botão Voltar */}
                  <Button
                    variant="success"
                    className="mt-3 w-100"
                    style={{ fontSize: "1.1rem", padding: "10px" }}
                    onClick={() => window.history.back()}
                  >
                    Voltar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <p style={{ fontSize: "1.2rem" }}>Nenhum dado disponível.</p>
        )}
      </Row>
    </Container>
  );
}
