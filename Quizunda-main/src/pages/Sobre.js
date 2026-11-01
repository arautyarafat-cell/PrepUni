import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";
import "./Sobre.css";

const PROFESSORES = [
  {
    nome: "Prof. Isaquel Silva",
    disciplina: "Direito Constitucional & Legislação",
    foto: "https://estoupreparado.com.br/assets/img/site/logo.webp",
    descricao: "Especialista em carreiras policiais com mais de 10 anos de docência e centenas de alunos aprovados nos primeiros lugares."
  },
  {
    nome: "Prof. João Batista",
    disciplina: "Língua Portuguesa & Redação",
    foto: "https://estoupreparado.com.br/assets/img/site/logo.webp",
    descricao: "Foco absoluto no estilo de cobrança das bancas examinadoras (CEBRASPE, IGEDUC, AOCP, FCC)."
  },
  {
    nome: "Prof. Carlos Eduardo",
    disciplina: "Raciocínio Lógico & Matemática",
    foto: "https://estoupreparado.com.br/assets/img/site/logo.webp",
    descricao: "Método descomplica com resolução prática de questões e técnicas de agilidade para o dia da prova."
  }
];

export default function Sobre() {
  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <AppNavbar />

      {/* 🔹 Breadcrumb Estou Preparado */}
      <div id="breadcrumb">
        <Container>
          <span className="titulo">Sobre</span>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/">Home</a></li>
              <li className="breadcrumb-item active" aria-current="page">Sobre</li>
            </ol>
          </nav>
        </Container>
      </div>

      <div id="sobre" className="py-5">
        <Container className="pt-2 pb-5">
          <div className="titulo-novo-1">Conheça</div>
          <div className="titulo-novo-2">Nossa História</div>

          <div className="bg-white p-4 p-md-5 rounded shadow-sm border mb-5">
            <p className="lead" style={{ lineHeight: "1.8", color: "#333", textIndent: "0" }}>
              A <strong>PLATAFORMA PREPARATÓRIO UNIVERSITÁRIO</strong> surgiu com o objetivo de oferecer uma
              preparação de excelência para as provas de Exames de Admissão, Vestibulares e
              Seleções Acadêmicas.
            </p>
            <p style={{ lineHeight: "1.8", color: "#555", textIndent: "0" }}>
              O <strong>PREPARATÓRIO UNIVERSITÁRIO</strong> possui uma experiente equipe de professores que tem o
              propósito de capacitar nossos estudantes para enfrentar os desafios dos diversos processos
              de seleção universitária. Os cursos oferecidos pela plataforma são calcados na excelência na qualidade de
              ensino, simulados estruturados e acompanhamento contínuo. A finalidade maior de nossa
              equipe é <strong>REALIZAR OS SEUS SONHOS</strong>.
            </p>

            <Row className="mt-5 g-4">
              <Col md={6}>
                <div className="p-4 rounded h-100" style={{ backgroundColor: "#f0f4ff", borderLeft: "4px solid #0044fc" }}>
                  <h4 className="fw-bold" style={{ color: "#0044fc" }}>Missão</h4>
                  <p className="text-secondary mb-4" style={{ textIndent: "0" }}>
                    Oferecer cursos com excelência e qualidade, disseminando saberes que visam à
                    preparação integral de estudantes e profissionais para a conquista da aprovação e
                    estabilidade no serviço público.
                  </p>

                  <h4 className="fw-bold" style={{ color: "#0044fc" }}>Visão</h4>
                  <p className="text-secondary mb-0" style={{ textIndent: "0" }}>
                    Tornar-se a maior referência em preparação para concursos públicos e seleções do
                    país, unindo tecnologia avançada e compromisso pedagógico.
                  </p>
                </div>
              </Col>

              <Col md={6}>
                <div className="p-4 rounded h-100" style={{ backgroundColor: "#fff7f0", borderLeft: "4px solid #f86f03" }}>
                  <h4 className="fw-bold" style={{ color: "#f86f03" }}>Nossos Valores</h4>
                  <ul className="list-unstyled text-secondary" style={{ lineHeight: "2" }}>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Ética, transparência e respeito ao concurseiro</li>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Equipe docente com elevado grau de especialização</li>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Inovação didática e constante atualização com os editais</li>
                    <li><i className="fa fa-check-circle text-primary me-2"></i> Responsabilidade social e inclusão pelo ensino</li>
                  </ul>
                </div>
              </Col>
            </Row>

            <div className="mt-5 pt-4 border-top">
              <h5 className="fw-bold text-dark mb-3">Dados Institucionais</h5>
              <Row className="text-muted small">
                <Col md={4} className="mb-2">
                  <strong>CNPJ:</strong> 40.336.270/0001-92
                </Col>
                <Col md={4} className="mb-2">
                  <strong>Razão Social:</strong> A M A RODRIGUES ME
                </Col>
                <Col md={4} className="mb-2">
                  <strong>Localização:</strong> CEP: 55700-000 - Limoeiro-PE
                </Col>
              </Row>
            </div>
          </div>

          {/* 🔹 Corpo Docente / Equipe */}
          <div className="titulo-novo-1 mt-5">CONHEÇA</div>
          <div className="titulo-novo-2">Nossa Equipe de Professores</div>

          <Row className="g-4">
            {PROFESSORES.map((prof, i) => (
              <Col key={i} xs={12} sm={6} md={4}>
                <Card className="h-100 border shadow-sm text-center p-3">
                  <div className="my-3 d-flex justify-content-center">
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        backgroundColor: "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "3px solid #0044fc"
                      }}
                    >
                      <i className="fa fa-chalkboard-teacher fa-2x text-primary"></i>
                    </div>
                  </div>
                  <Card.Body>
                    <Card.Title className="fw-bold fs-5">{prof.nome}</Card.Title>
                    <div className="text-primary fw-semibold small mb-2">{prof.disciplina}</div>
                    <Card.Text className="text-muted small" style={{ lineHeight: "1.6" }}>
                      {prof.descricao}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      <AppFooter />
    </div>
  );
}
