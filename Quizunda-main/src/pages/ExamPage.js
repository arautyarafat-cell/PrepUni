import React, { useState, useEffect } from 'react';
import { Navbar, Container, Button, ButtonGroup, Dropdown, Card, ProgressBar } from 'react-bootstrap';
import { useNavigate, useParams } from "react-router-dom";
import AppFooter from "../components/AppFooter";
import { API_BASE_URL } from "../config/apiConfig";

const MOCK_QUESTIONS = [
  {
    id: 1,
    tema_0: "Direito Constitucional",
    disciplina_0: "Direito Constitucional",
    question: "De acordo com a Constituição Federal de 1988, a segurança pública, dever do Estado, direito e responsabilidade de todos, é exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio, através dos seguintes órgãos, EXCETO:",
    options: [
      "Polícia Federal e Polícia Rodoviária Federal",
      "Polícias civis e polícias militares",
      "Corpos de bombeiros militares e polícias penais",
      "Forças Armadas em caráter permanente",
      "Polícias penais federal, estaduais e distrital"
    ],
    correctAnswer: "D"
  },
  {
    id: 2,
    tema_0: "Língua Portuguesa",
    disciplina_0: "Português",
    question: "Assinale a alternativa em que o uso do acento indicativo de crase é OBRIGATÓRIO:",
    options: [
      "O candidato dirigiu-se a pé até o local da prova.",
      "Entregou o documento à fiscal logo ao entrar na sala.",
      "Começou a responder todas as questões com tranquilidade.",
      "Referiu-se a uma vaga concorrida do certame.",
      "Saiu às pressas para não perder o prazo."
    ],
    correctAnswer: "B"
  }
];

function normalizarPergunta(p) {
  if (!p) return null;
  const letras = ['A', 'B', 'C', 'D', 'E'];

  // Se já possui options array estruturado
  if (Array.isArray(p.options) && p.options.length > 0) {
    return {
      id: p.id,
      question: p.question || p.questao || "Questão sem enunciado",
      options: p.options,
      correctAnswer: p.correctAnswer || p.correctanswer || "A",
      tema_0: p.tema_0 || p.tema || p.disciplina || "Geral",
      disciplina_0: p.disciplina_0 || p.disciplina || "Geral",
      explanation: p.explanation || ""
    };
  }

  // Montar array de opções a partir dos campos do banco de dados
  const correta = p.correctAnswer || p.correctanswer || "";
  const erradas = [
    p.wrongAnswer1 || p.wronganswer1,
    p.wrongAnswer2 || p.wronganswer2,
    p.wrongAnswer3 || p.wronganswer3,
    p.wrongAnswer4 || p.wronganswer4
  ].filter(Boolean);

  const todas = [
    { texto: String(correta).trim(), ehCorreta: true },
    ...erradas.map(e => ({ texto: String(e).trim(), ehCorreta: false }))
  ].filter(o => o.texto.length > 0);

  if (todas.length === 0) {
    todas.push({ texto: "Opção A", ehCorreta: true });
    todas.push({ texto: "Opção B", ehCorreta: false });
  }

  todas.sort(() => Math.random() - 0.5);
  const idx = todas.findIndex(o => o.ehCorreta);
  const letraCorreta = idx !== -1 ? letras[idx] : "A";

  return {
    id: p.id,
    question: p.question || p.questao || "Questão sem enunciado",
    options: todas.map(o => o.texto),
    correctAnswer: letraCorreta,
    tema_0: p.tema_0 || p.tema || p.disciplina || "Geral",
    disciplina_0: p.disciplina_0 || p.disciplina || "Geral",
    explanation: p.explanation || ""
  };
}

function Exame() {
  const [perguntas, setPerguntas] = useState([]);
  const [indexAtual, setIndexAtual] = useState(0);
  const [tempo, setTempo] = useState(3 * 60 * 60);
  const [rodando, setRodando] = useState(false);
  const [qtdPerguntas, setQtdPerguntas] = useState(10);
  const [bloqueado, setBloqueado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [respostaClicada, setRespostaClicada] = useState(null);
  const [disciplinaStats, setDisciplinaStats] = useState({});
  const [roomTitle, setRoomTitle] = useState("");

  const navigate = useNavigate();
  const { id: roomId } = useParams();

  // Buscar informações da sala caso haja roomId
  useEffect(() => {
    if (roomId) {
      fetch(`${API_BASE_URL}/salas_e`)
        .then((res) => res.json())
        .then((salas) => {
          if (Array.isArray(salas)) {
            const sala = salas.find((s) => String(s.id) === String(roomId));
            if (sala) setRoomTitle(sala.roomName || sala.nome || "");
          }
        })
        .catch(() => {});
    }
  }, [roomId]);

  useEffect(() => {
    const url = roomId
      ? `${API_BASE_URL}/exams/${roomId}/questions`
      : `${API_BASE_URL}/perguntas?limit=${qtdPerguntas}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatadas = data.map(normalizarPergunta).filter(Boolean);
          setPerguntas(formatadas);
        } else {
          setPerguntas(MOCK_QUESTIONS);
        }
      })
      .catch(() => {
        setPerguntas(MOCK_QUESTIONS);
      });
  }, [qtdPerguntas, roomId]);

  useEffect(() => {
    let timer;
    if (rodando && tempo > 0) {
      timer = setInterval(() => setTempo(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [rodando, tempo]);

  const formatarTempo = (seg) => {
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = seg % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const verificarResposta = (letra) => {
    if (bloqueado) return;
    const p = perguntas[indexAtual];
    if (!p) return;
    setRespostaClicada(letra);
    setBloqueado(true);

    const ehCorreto = letra === p.correctAnswer;
    const disc = p.disciplina_0 || p.disciplina || p.tema_0 || "Geral";

    if (ehCorreto) {
      setAcertos(a => a + 1);
    } else {
      setErros(e => e + 1);
    }

    setDisciplinaStats(prev => {
      const cur = prev[disc] || { nome: disc, acertos: 0, erros: 0 };
      return {
        ...prev,
        [disc]: {
          nome: disc,
          acertos: cur.acertos + (ehCorreto ? 1 : 0),
          erros: cur.erros + (ehCorreto ? 0 : 1)
        }
      };
    });
  };

  const proximaPergunta = () => {
    setBloqueado(false);
    setRespostaClicada(null);
    if (indexAtual + 1 < perguntas.length) {
      setIndexAtual(i => i + 1);
    } else {
      finalizarExame();
    }
  };

  const finalizarExame = async () => {
    setRodando(false);

    // Consolidar aproveitamento por disciplina
    const disciplinasList = Object.values(disciplinaStats).map((d) => {
      const tot = d.acertos + d.erros;
      return {
        nome: d.nome,
        respondidas: d.acertos,
        naoRespondidas: d.erros,
        acertos: d.acertos,
        erros: d.erros,
        total: tot,
        percentual: tot > 0 ? Math.round((d.acertos / tot) * 100) : 0
      };
    });

    const totalRespondidas = acertos + erros;
    const score = totalRespondidas > 0 ? Math.round((acertos / totalRespondidas) * 100) : 0;
    const passed = score >= 50;

    const dataHoje = new Date().toISOString().split("T")[0];
    const nomeSimulado = roomTitle || `Simulado #${Math.floor(Date.now() / 1000).toString().slice(-4)}`;

    const attempt = {
      id: Date.now(),
      titulo: nomeSimulado,
      data: dataHoje,
      score,
      acertos,
      erros,
      total: totalRespondidas,
      passed,
      disciplinas: disciplinasList
    };

    // 1. Salvar no localStorage para atualização imediata
    try {
      const existing = JSON.parse(localStorage.getItem("user_exam_history") || "[]");
      const updated = [attempt, ...existing.filter((e) => e.id !== attempt.id)].slice(0, 30);
      localStorage.setItem("user_exam_history", JSON.stringify(updated));
    } catch (e) {
      console.warn("Aviso ao salvar histórico no localStorage:", e);
    }

    // 2. Salvar no backend via API
    try {
      const token =
        localStorage.getItem("token") ||
        JSON.parse(localStorage.getItem("user") || "{}").token;

      if (token) {
        await fetch(`${API_BASE_URL}/exam-attempts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            examId: roomId ? parseInt(roomId, 10) : null,
            title: nomeSimulado,
            score,
            correctAnswers: acertos,
            wrongAnswers: erros,
            totalQuestions: totalRespondidas,
            passed,
            disciplinas: disciplinasList
          })
        });
      }
    } catch (err) {
      console.warn("Aviso ao salvar resultado no backend:", err);
    }

    alert(`Simulado finalizado!\n\nTotal Respondidas: ${totalRespondidas}\nAcertos: ${acertos}\nErros: ${erros}\nAproveitamento: ${score}%`);
    navigate("/PortalPage");
  };

  const iniciarExame = () => {
    setRodando(true);
    setIndexAtual(0);
    setAcertos(0);
    setErros(0);
    setDisciplinaStats({});
    setTempo(3 * 60 * 60);
    setBloqueado(false);
    setRespostaClicada(null);
  };

  const pergunta = perguntas[indexAtual];

  const getCorBotao = (letra) => {
    if (!bloqueado || !pergunta) return null;
    if (letra === pergunta.correctAnswer) return 'verde';
    if (letra === respostaClicada && letra !== pergunta.correctAnswer) return 'vermelho';
    return null;
  };

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      {/* 🔹 Top Header Preparatório Universitário */}
      <Navbar bg="white" expand="md" className="shadow-sm border-bottom py-2">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
            <img
              src="/logo-preparatorio.svg"
              alt="Preparatório Universitário"
              className="ep-logo-img"
              style={{ maxHeight: "48px" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/logo.svg";
              }}
            />
            <span className="fw-bold ms-2" style={{ color: "#0044fc", fontSize: "16px" }}>
              Simulador de Provas
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-responsivo" />

          <Navbar.Collapse id="navbar-responsivo" className="justify-content-end">
            <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 pt-2 pt-md-0">
              <span className="fw-bold fs-6 fs-md-5 px-3 py-1 rounded bg-light border text-primary">
                <i className="far fa-clock me-1"></i> {formatarTempo(tempo)}
              </span>

              <Dropdown as={ButtonGroup}>
                <Button variant="outline-primary" size="sm" className="fw-semibold">
                  {qtdPerguntas} Questões
                </Button>
                <Dropdown.Toggle split variant="outline-primary" size="sm" />
                <Dropdown.Menu>
                  {[10, 30, 50].map(n => (
                    <Dropdown.Item key={n} onClick={() => setQtdPerguntas(n)}>
                      {n} Perguntas
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              {rodando && (
                <Button variant="danger" size="sm" className="fw-bold" onClick={finalizarExame}>
                  Finalizar
                </Button>
              )}

              <Button variant="light" size="sm" className="border" onClick={() => navigate("/PortalPage")}>
                Voltar
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-4" style={{ maxWidth: "860px" }}>
        {rodando && perguntas.length > 0 && (
          <ProgressBar
            now={((indexAtual + 1) / perguntas.length) * 100}
            className="mb-4"
            style={{ height: "8px", backgroundColor: "#e2e8f0" }}
          />
        )}

        {rodando && pergunta ? (
          <Card className="shadow-sm border p-3 p-md-4 bg-white rounded-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-primary">Questão {indexAtual + 1} de {perguntas.length}</span>
                <span className="text-muted small fw-bold">{pergunta.tema_0 || pergunta.disciplina_0}</span>
              </div>

              <h5 className="fw-bold mb-4 text-dark" style={{ lineHeight: "1.6" }}>
                {pergunta.question}
              </h5>

              <div className="d-flex flex-column gap-2 mb-4">
                {Array.isArray(pergunta.options) && pergunta.options.map((opcao, index) => {
                  const letra = ['A', 'B', 'C', 'D', 'E'][index];
                  const cor = getCorBotao(letra);

                  return (
                    <Button
                      key={index}
                      onClick={() => verificarResposta(letra)}
                      className="text-start py-2 py-md-3 px-3 px-md-4 rounded-3 border"
                      disabled={!rodando || bloqueado}
                      style={{
                        backgroundColor: cor === 'verde' ? '#10b981' : cor === 'vermelho' ? '#ef4444' : '#ffffff',
                        color: cor ? '#ffffff' : '#212529',
                        borderColor: cor ? 'transparent' : '#e5e7eb',
                        fontWeight: "500",
                        transition: "all 0.2s"
                      }}
                    >
                      <strong className="me-2" style={{ color: cor ? '#ffffff' : '#0044fc' }}>
                        {letra})
                      </strong>
                      {opcao}
                    </Button>
                  );
                })}
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pt-3 border-top">
                <div className="small fw-bold">
                  <span className="text-success me-3">✔ Acertos: {acertos}</span>
                  <span className="text-danger">✘ Erros: {erros}</span>
                </div>

                <Button
                  className="ep-btn-entrar w-100 w-sm-auto justify-content-center"
                  onClick={proximaPergunta}
                  disabled={!rodando}
                >
                  {indexAtual + 1 === perguntas.length ? "Finalizar Simulado" : "Próxima Questão"} <i className="fa fa-arrow-right ms-1"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <div className="bg-white p-5 rounded-3 border shadow-sm text-center">
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "rgba(0, 68, 252, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px"
              }}
            >
              <i className="fa fa-laptop-code fa-2x text-primary"></i>
            </div>
            <h3 className="fw-bold mb-2" style={{ color: "#0044fc" }}>
              Simuladão Preparatório Universitário
            </h3>
            <p className="text-muted lead mb-4" style={{ maxWidth: "600px", margin: "0 auto 20px" }}>
              Avalie seus conhecimentos com questões atualizadas e cronômetro em tempo real.
            </p>
            <Button className="ep-btn-entrar px-5 py-3 fs-6" onClick={iniciarExame}>
              <i className="fa fa-play me-2"></i> Começar Agora
            </Button>
          </div>
        )}
      </Container>

      <AppFooter />
    </div>
  );
}

export default Exame;
