import React, { useState, useEffect } from "react";
import { Button, Card, Modal, Form } from "react-bootstrap";

import { useNavigate } from "react-router-dom"; // botão voltar
import { Container, Navbar, Nav, Carousel, NavDropdown } from 'react-bootstrap';
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import UserProfileModal from "../components/UserProfileModal";

const API_URL = `${API_BASE_URL}/courses`;

export default function MeusCursos() {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // ---------------- ESTADOS PARA MODAIS ----------------
  const [showExamModal, setShowExamModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showComplementModal, setShowComplementModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || localStorage.getItem("adminUser") || "{}");
    } catch {
      return null;
    }
  });
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [complements, setComplements] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBankdModal, setShowBankdModal] = useState(false);
  // recriar o modal para adicionar a conta do whatsapp!


  // ---------------- ESTADOS PARA FORMULÁRIOS ----------------
  const [examForm, setExamForm] = useState({
    courseId: "",
    roomName: ""
  });

  const [configForm, setConfigForm] = useState({
    courseId: '',
    supportWhatsapp: '',
    paymentWhatsapp: '',
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    tema: "",
    disciplina: "",
    url: "",
    courseId: ""
  });

  // No seu componente
  const [supportForm, setSupportForm] = useState({
    courseId: "",
    discipline: "",
    materialUrl: ""
  });

  // Função para atualizar os campos dinamicamente

  const [complementForm, setComplementForm] = useState({
    courseId: "",
    disciplina: "",   // corrigido para 'disciplina'
    tema: "",         // campo novo
    materials: ""     // campo novo
  });


  // Lista de questões já cadastradas

  const [questions, setQuestions] = useState([]);
  const [supportMaterials, setSupportMaterials] = useState([]);

  const [questionForm, setQuestionForm] = useState({
    roomId: "",
    question: "",
    correctAnswer: "",
    wrongAnswer1: "",
    wrongAnswer2: "",
    wrongAnswer3: "",
    wrongAnswer4: "",
    tema: "",
    disciplina: ""
  });



  const [examRooms, setExamRooms] = useState([]); // lista de salas criadas

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    thumbnail: null,
    account: "",
    iban: "",
    express_number: "",
    details: ""

  });



  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const getEmbedUrl = (url) => {
    if (!url?.trim()) return "";

    try {
      const parsedUrl = new URL(url.trim());
      const hostname = parsedUrl.hostname
        .toLowerCase()
        .replace(/^www\./, "");

      let videoId = "";

      // YouTube: vídeos normais, Shorts e links de incorporação
      if (
        hostname === "youtube.com" ||
        hostname === "m.youtube.com" ||
        hostname === "youtube-nocookie.com"
      ) {
        const match = parsedUrl.pathname.match(
          /^\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]+)/
        );

        videoId = parsedUrl.searchParams.get("v") || match?.[1];

        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // YouTube: links curtos youtu.be
      if (hostname === "youtu.be") {
        videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];

        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Vimeo
      if (hostname === "vimeo.com") {
        videoId = parsedUrl.pathname.split("/").filter(Boolean).pop();

        if (videoId && /^\d+$/.test(videoId)) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }

      return "";
    } catch {
      return "";
    }
  };





  useEffect(() => {
    const fetchExamRooms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/exam-classes`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        if (!res.ok) throw new Error("Erro ao buscar salas");
        const data = await res.json();
        setExamRooms(data);
      } catch (err) {
        console.error("Erro ao carregar salas:", err);
      }
    };

    fetchExamRooms();
  }, [user.token]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchCourses();
    }
  }, [user?.token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });


  const handleVideoSave = async () => {
    try {
      // Gerar o embed a partir do link do vídeo
      const embedUrl = getEmbedUrl(videoForm.url);

      // Validar os campos obrigatórios
      if (
        !videoForm.title?.trim() ||
        !videoForm.tema?.trim() ||
        !videoForm.disciplina?.trim() ||
        !embedUrl ||
        !videoForm.url_drive?.trim() ||
        !videoForm.courseId
      ) {
        alert("Preenche todos os campos obrigatórios, incluindo o link do Google Drive.");
        return;
      }

      // Dados enviados para o backend
      const videoData = {
        title: videoForm.title.trim(),
        tema: videoForm.tema.trim(),
        disciplina: videoForm.disciplina.trim(),
        courseId: Number(videoForm.courseId),
        url: embedUrl,
        url_drive: videoForm.url_drive.trim()
      };

      const response = await fetch(
        `${API_BASE_URL}/video-lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`
          },
          body: JSON.stringify(videoData)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Erro da API:", response.status, data);

        alert(
          data.missingFields
            ? `Preenche os seguintes campos: ${data.missingFields.join(", ")}`
            : data.error || "Erro ao salvar vídeo aula."
        );

        return;
      }

      alert("Vídeo aula adicionada com sucesso!");

      setShowVideoModal(false);

      setVideoForm({
        title: "",
        tema: "",
        disciplina: "",
        url: "",
        url_drive: "",
        courseId: ""
      });

    } catch (error) {
      console.error("Erro ao guardar vídeo aula:", error);
      alert("Erro de conexão com o servidor!");
    }
  };


  const openConfigModal = () => {
    fetchCourses();

    setConfigForm({
      courseId: '',
      supportWhatsapp: '',
      paymentWhatsapp: '',
    });

    setShowConfigModal(true);
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;

    setConfigForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveConfig = async () => {
    try {

      const response = await fetch(
        `${API_BASE_URL}/course-contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(configForm)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSaveSuccess(true);

      setConfigForm({
        courseId: '',
        supportWhatsapp: '',
        paymentWhatsapp: ''
      });

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  const handleSave = async () => {
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API_URL}/${editing.id}` : API_URL;

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("duration", form.duration);
      formData.append("country", form.country);
      formData.append("account", form.account);
      formData.append("iban", form.iban);
      formData.append("express_number", form.express_number);
      formData.append("details", form.details);


      if (form.thumbnail) {
        formData.append("thumbnail", form.thumbnail);
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Erro ao salvar curso");

      await fetchCourses();
      setShowModal(false);
      setEditing(null);
      setForm({
        title: "",
        description: "",
        price: "",
        duration: "",
        country: "",
        thumbnail: null,
        account: "",
        iban: "",
        express_number: "",
        details: ""

      });
    } catch (err) {
      console.error("Erro ao salvar curso:", err);
      alert("Erro ao salvar curso: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (!res.ok) throw new Error("Erro ao deletar curso");

      await fetchCourses();
    } catch (err) {
      console.error("Erro ao deletar curso:", err);
      alert("Erro ao deletar curso: " + err.message);
    }
  };

  const openModal = (course = null) => {
    setEditing(course);
    setForm(
      course || {
        title: "",
        description: "",
        price: "",
        duration: "",
        country: "",

        thumbnail: null,
        account: "",
        iban: "",
        express_number: "",
        details: ""

      }
    );
    setShowModal(true);
  };

  // ---------------- HANDLERS ----------------
  const handleExamChange = (e) => setExamForm({ ...examForm, [e.target.name]: e.target.value });
  const handleSupportChange = (e) => setSupportForm({ ...supportForm, [e.target.name]: e.target.value });
  const handleComplementChange = (e) => setComplementForm({ ...complementForm, [e.target.name]: e.target.value });
  const handleQuestionChange = (e) => setQuestionForm({ ...questionForm, [e.target.name]: e.target.value });
  const handleVideoChange = (e) => {
    const { name, value } = e.target;
    setVideoForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleExamSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/exam-classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          courseId: examForm.courseId,
          roomName: examForm.roomName,
        })
      });

      if (!res.ok) throw new Error("Erro ao salvar sala de exame");

      const data = await res.json();
      alert(`Sala "${data.roomName}" criada com sucesso!`);
      setExamRooms([...examRooms, data]);
      setShowExamModal(false);
    } catch (err) {
      console.error("Erro ao salvar sala:", err);
      alert("Erro ao salvar sala: " + err.message);
    }
  };


  const handleSupportMaterialSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/support-materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}` // token do usuário logado
        },
        body: JSON.stringify(supportForm), // envia courseId, discipline, materialUrl
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar material de apoio");
      }

      const data = await response.json();
      alert("Material salvo com sucesso!");
      setShowSupportModal(false);
    } catch (error) {
      console.error(error);
      alert("Falha ao salvar material");
    }
  };


  const handleComplementSave = async () => {
    try {
      console.log("ComplementForm enviado:", complementForm);

      const res = await fetch(`${API_BASE_URL}/complements`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(complementForm)
      });

      if (!res.ok) throw new Error("Erro ao salvar matéria complementar");

      const data = await res.json();
      alert("Matéria complementar adicionada com sucesso!");

      // Atualiza lista local de complementos
      setComplements([...complements, data]);

      setShowComplementModal(false);
      setComplementForm({
        courseId: "",
        disciplina: "",
        tema: "",       // novo campo
        materials: ""
      });
    } catch (err) {
      console.error("Erro ao salvar matéria complementar:", err);
      alert("Erro ao salvar matéria complementar: " + err.message);
    }
  };


  const handleQuestionSave = async () => {
    try {
      console.log("QuestionForm enviado:", questionForm);

      const res = await fetch(`${API_BASE_URL}/exam-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },

        body: JSON.stringify(questionForm)
      });

      if (!res.ok) throw new Error("Erro ao salvar questão");

      const data = await res.json();
      alert(`Questão adicionada à sala ${questionForm.roomId}`);

      // Atualiza lista local de questões
      setQuestions([...questions, data]);

      setShowQuestionModal(false);
      setQuestionForm({
        roomId: "",
        question: "",
        correctAnswer: "",
        wrongAnswer1: "",
        wrongAnswer2: "",
        wrongAnswer3: "",
        wrongAnswer4: "",
        tema: "",        // novo campo
        disciplina: ""   // novo campo
      });
    } catch (err) {
      console.error("Erro ao salvar questão:", err);
      alert("Erro ao salvar questão: " + err.message);
    }
  };




  return (
    <div className="container mt-4">
      <Navbar bg="light" expand="lg" className="custom-navbar">
        <Container>
          <Navbar.Brand href="/" className="brand-text">
            prepUni Cursos Preparatórios Universitários
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <NavDropdown title={currentUser?.name ? `Olá, ${currentUser.name.split(" ")[0]}` : "Menu"} id="basic-nav-dropdown">
                <NavDropdown.Item onClick={() => setShowProfileModal(true)}>
                  <i className="fa fa-user-edit me-1 text-primary"></i> Editar Meu Perfil
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => openModal()}>Novo Curso</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowExamModal(true)}>Criar Sala de Exame</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowQuestionModal(true)}>Adicionar Questão</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowSupportModal(true)}>Material de Apoio</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowComplementModal(true)}>Matéria Complementar</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowVideoModal(true)}>Video Aula</NavDropdown.Item>
                <NavDropdown.Item onClick={() => openConfigModal(true)}>Adicionar WhatsApp</NavDropdown.Item>
                <NavDropdown.Item onClick={() => navigate("/")}>Página inicial →</NavDropdown.Item>



              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="row">
        {courses.map((course) => (
          <div className="col-md-4 mb-3" key={course.id}>
            <Card style={{ maxHeight: "400px" }}>
              <Card.Img
                variant="top"
                src={getUploadUrl(course.thumbnail)}
                alt="thumbnail"
                style={{ height: "150px", objectFit: "cover" }}
              />
              <Card.Body className="d-flex flex-column" style={{ padding: "10px" }}>
                <Card.Title style={{ fontSize: "1rem" }}>{course.title}</Card.Title>
                <Card.Text className="text-muted small flex-grow-1" style={{ fontSize: "0.85rem" }}>
                  {course.description}
                </Card.Text>
                <p style={{ fontSize: "0.85rem" }}><strong>Duração:</strong> {course.duration}</p>
                <h6 className="fw-bold mb-2">{course.price} Kz</h6>
                {course.videoUrl && (
                  <video width="100%" controls style={{ maxHeight: "120px" }}>
                    <source src={course.videoUrl} type="video/mp4" />
                    Seu navegador não suporta vídeo.
                  </video>
                )}
                <div className="d-flex gap-2 mt-2">
                  <Button variant="warning" size="sm" className="w-100" onClick={() => openModal(course)}>Editar</Button>
                  <Button variant="danger" size="sm" className="w-100" onClick={() => handleDelete(course.id)}>Excluir</Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* ---------------- MODAL NOVO CURSO ---------------- */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? "Editar Curso" : "Novo Curso"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Título</Form.Label>
              <Form.Control name="title" value={form.title} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Select name="description" value={form.description} onChange={handleChange}>
                <option value="">Selecione uma opção</option>
                <option value="Ciências da Saúde">Ciências da Saúde</option>
                <option value="Ciências Sociais e Humanas">Ciências Sociais e Humanas</option>
                <option value="Ciências das Engenharias">Ciências das Engenharias</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Preço (Kz)</Form.Label>
              <Form.Control name="price" value={form.price} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duração</Form.Label>
              <Form.Control name="duration" value={form.duration} onChange={handleChange} />
            </Form.Group>

            {/* NOVO CAMPO PAÍS */}
            <Form.Group className="mb-3">
              <Form.Label>Província</Form.Label>
              <Form.Control name="country" value={form.country || ""} onChange={handleChange} />
            </Form.Group>


            <Form.Group className="mb-3">
              <Form.Label>Thumbnail (Upload de Imagem)</Form.Label>
              <Form.Control
                type="file"
                name="thumbnail"
                onChange={(e) => setForm({ ...form, thumbnail: e.target.files[0] })}
              />
            </Form.Group>


            <Form.Group className="mb-3">
              <Form.Label>Conta Bancária</Form.Label>
              <Form.Control name="account" value={form.account || ""} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>IBAN</Form.Label>
              <Form.Control name="iban" value={form.iban || ""} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Express</Form.Label>
              <Form.Control name="express_number" value={form.express_number || ""} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Detalhes do Preparatório</Form.Label>
              <Form.Control as="textarea" rows={3} name="details" value={form.details} onChange={handleChange} />
            </Form.Group>




          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Salvar</Button>
        </Modal.Footer>
      </Modal>


      {/* ---------------- MODAL SALA DE EXAME ---------------- */}
      {/* ---------------- MODAL SALA DE EXAME ---------------- */}
      <Modal show={showExamModal} onHide={() => setShowExamModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Criar Sala de Exame</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Curso</Form.Label>
              <Form.Select
                name="courseId"
                value={examForm.courseId}
                onChange={handleExamChange}
              >
                <option value="">Selecione um curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nome da Sala</Form.Label>
              <Form.Control
                type="text"
                name="roomName"
                value={examForm.roomName || ""}
                onChange={handleExamChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">


            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExamModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleExamSave}>
            Criar Sala
          </Button>

        </Modal.Footer>
      </Modal>

      {/* ---------------- MODAL ADICIONAR QUESTÃO ---------------- */}
      <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Questão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sala de Exame</Form.Label>
              <Form.Select
                name="roomId"
                value={questionForm.roomId}
                onChange={(e) => setQuestionForm({ ...questionForm, roomId: e.target.value })}
              >
                <option value="">Selecione uma sala</option>
                {examRooms.map(r => (
                  <option key={r.id} value={r.id}>{r.roomName}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tema da Pergunta</Form.Label>
              <Form.Control
                name="tema"
                value={questionForm.tema}
                onChange={handleQuestionChange}
                placeholder="Digite o tema da pergunta"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Disciplina</Form.Label>
              <Form.Select
                name="disciplina"
                value={questionForm.disciplina}
                onChange={handleQuestionChange}
              >
                <option value="">Selecione uma disciplina</option>
                <option value="Biologia">Biologia</option>
                <option value="Matemática">Matemática</option>
                <option value="Física">Física</option>
                <option value="Língua Portuguesa">Língua Portuguesa</option>
                <option value="Língua Francesa">Língua Francesa</option>
                <option value="Língua Inglesa">Língua Inglesa</option>
                <option value="Línguas Africanas">Línguas Africanas</option>
                <option value="Química">Química</option>
                <option value="História">História</option>
                <option value="Cultura Geral">Cultura Geral</option>
                <option value="Geografia">Geografia</option>
                <option value="Psicologia">Psicologia</option>

                {/* outras disciplinas */}
              </Form.Select>
            </Form.Group>


            <Form.Group className="mb-3">
              <Form.Label>Questão</Form.Label>
              <Form.Control as="textarea" rows={3} name="question" value={questionForm.question} onChange={handleQuestionChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Resposta Correta</Form.Label>
              <Form.Control name="correctAnswer" value={questionForm.correctAnswer} onChange={handleQuestionChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Respostas Erradas</Form.Label>
              {[1, 2, 3, 4].map((num) => (
                <Form.Control
                  key={num}
                  className="mb-2"
                  name={`wrongAnswer${num}`}
                  value={questionForm[`wrongAnswer${num}`]}
                  onChange={handleQuestionChange}
                  placeholder={`Resposta errada ${num}`}
                />
              ))}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleQuestionSave}>Salvar Questão</Button>
        </Modal.Footer>
      </Modal>

      {/* ---------------- MODAL MATERIAL DE APOIO ---------------- */}

      <Modal show={showSupportModal} onHide={() => setShowSupportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Material de Apoio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Primeiro campo: Curso */}
            <Form.Group className="mb-3">
              <Form.Label>Curso</Form.Label>
              <Form.Select
                name="courseId"
                value={supportForm.courseId}
                onChange={handleSupportChange}
              >
                <option value="">Selecione um curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Segundo campo: Disciplina (dropdown) */}
            <Form.Group className="mb-3">
              <Form.Label>Disciplina</Form.Label>
              <Form.Select
                name="discipline"
                value={supportForm.discipline}
                onChange={handleSupportChange}
              >
                <option value="">Selecione uma disciplina</option>
                <option value="Biologia">Biologia</option>
                <option value="Matemática">Matemática</option>
                <option value="Física">Física</option>
                <option value="Língua Portuguesa">Língua Portuguesa</option>
                <option value="Língua Francesa">Língua Francesa</option>
                <option value="Língua Inglesa">Língua Inglesa</option>
                <option value="Línguas Africanas">Línguas Africanas</option>
                <option value="Química">Química</option>
                <option value="História">História</option>
                <option value="Cultura Geral">Cultura Geral</option>
                <option value="Geografia">Geografia</option>
                <option value="Psicologia">Psicologia</option>
                {/* Adicione mais opções conforme necessário */}
              </Form.Select>
            </Form.Group>

            {/* Terceiro campo: URL do material */}
            <Form.Group className="mb-3">
              <Form.Label>URL do Material</Form.Label>
              <Form.Control
                type="url"
                name="materialUrl"
                value={supportForm.materialUrl}
                onChange={handleSupportChange}
                placeholder="https://exemplo.com/material.pdf"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSupportModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSupportMaterialSave}>Salvar</Button>
        </Modal.Footer>
      </Modal>



      <Modal show={showComplementModal} onHide={() => setShowComplementModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Matéria Complementar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Curso</Form.Label>
              <Form.Select
                name="courseId"
                value={complementForm.courseId}
                onChange={handleComplementChange}
              >
                <option value="">Selecione um curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Campo Tema da Matéria */}
            <Form.Group className="mb-3">
              <Form.Label>Tema da Matéria</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o tema da matéria..."
                name="tema"
                value={complementForm.tema}
                onChange={handleComplementChange}
              />
            </Form.Group>

            {/* Campo Disciplina (corrigido para 'disciplina') */}
            <Form.Group className="mb-3">
              <Form.Label>Disciplina</Form.Label>
              <Form.Select
                name="disciplina"
                value={complementForm.disciplina}
                onChange={handleComplementChange}
              >
                <option value="">Selecione uma disciplina</option>
                <option value="Biologia">Biologia</option>
                <option value="Matemática">Matemática</option>
                <option value="Física">Física</option>
                <option value="Língua Portuguesa">Língua Portuguesa</option>
                <option value="Língua Francesa">Língua Francesa</option>
                <option value="Língua Inglesa">Língua Inglesa</option>
                <option value="Línguas Africanas">Línguas Africanas</option>
                <option value="Química">Química</option>
                <option value="História">História</option>
                <option value="Cultura Geral">Cultura Geral</option>
                <option value="Geografia">Geografia</option>
                <option value="Psicologia">Psicologia</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Matérias</Form.Label>
              <Form.Control
                type="text"
                name="materials"
                placeholder="Cole aqui o link do material..."
                value={complementForm.materials}
                accept="application/pdf"
                onChange={handleComplementChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComplementModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleComplementSave}>Salvar</Button>
        </Modal.Footer>
      </Modal>

      <Modal

        show={showConfigModal}
        onHide={() => {
          setShowConfigModal(false);
          setSaveSuccess(false);
        }}
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            📞 Configuração de Contactos do Curso
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>


          <div className="alert alert-info">
            Configure os contactos que serão exibidos aos alunos deste curso.
          </div>



          {saveSuccess && (
            <div className="alert alert-success shadow-sm">
              <strong>✅ Configuração salva com sucesso!</strong>
              <br />
              Os contactos foram vinculados ao curso e já estão disponíveis para utilização.
            </div>

          )}

          <Form>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">
                🎓 Curso
              </Form.Label>

              <Form.Select
                name="courseId"
                value={configForm.courseId}
                onChange={handleConfigChange}
              >
                <option value="">
                  Selecione um curso
                </option>

                {courses.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="row">

              <div className="col-md-6">

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-success">
                    💬 WhatsApp de Dúvidas
                  </Form.Label>

                  <Form.Control
                    type="text"
                    name="supportWhatsapp"
                    value={configForm.supportWhatsapp}
                    onChange={handleConfigChange}
                    placeholder="link whatsapp"
                  />
                </Form.Group>

              </div>

              <div className="col-md-6">

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-warning">
                    💰 WhatsApp de Pagamentos
                  </Form.Label>

                  <Form.Control
                    type="text"
                    name="paymentWhatsapp"
                    value={configForm.paymentWhatsapp}
                    onChange={handleConfigChange}
                    placeholder="link whatsapp"
                  />
                </Form.Group>

              </div>

            </div>

            <div
              className="p-3 rounded"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0"
              }}
            >
              <small className="text-muted">
                ℹ️ Os números configurados aqui serão utilizados para
                suporte aos estudantes e orientações de pagamento.
              </small>
            </div>

          </Form>

        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowConfigModal(false);
              setSaveSuccess(false);
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="success"
            onClick={handleSaveConfig}
          >
            💾 Salvar Configuração
          </Button>

        </Modal.Footer>

      </Modal>
      <Modal show={showVideoModal} onHide={() => setShowVideoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Vídeo Aula</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Campo Título da Aula */}
            <Form.Group className="mb-3">
              <Form.Label>Título da Aula</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o título da aula..."
                name="title"
                value={videoForm.title}
                onChange={handleVideoChange}
              />
            </Form.Group>

            {/* Campo Tema da Vídeo Aula */}
            <Form.Group className="mb-3">
              <Form.Label>Tema da Vídeo Aula</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o tema da vídeo aula..."
                name="tema"
                value={videoForm.tema}
                onChange={handleVideoChange}
              />
            </Form.Group>

            {/* Campo Disciplina da Vídeo Aula */}
            <Form.Group className="mb-3">
              <Form.Label>Disciplina da Vídeo Aula</Form.Label>
              <Form.Select
                name="disciplina"
                value={videoForm.disciplina}
                onChange={handleVideoChange}
              >
                <option value="">Selecione uma disciplina</option>
                <option value="Biologia">Biologia</option>
                <option value="Matemática">Matemática</option>
                <option value="Física">Física</option>
                <option value="Língua Portuguesa">Língua Portuguesa</option>
                <option value="Língua Francesa">Língua Francesa</option>
                <option value="Língua Inglesa">Língua Inglesa</option>
                <option value="Línguas Africanas">Línguas Africanas</option>
                <option value="Química">Química</option>
                <option value="História">História</option>
                <option value="Cultura Geral">Cultura Geral</option>
                <option value="Geografia">Geografia</option>
                <option value="Psicologia">Psicologia</option>
              </Form.Select>
            </Form.Group>


            {/* Campo URL do Vídeo */}

            {/* Campo URL do Vídeo */}
            <Form.Group className="mb-3">
              <Form.Label>URL do Vídeo</Form.Label>

              <Form.Control
                type="text"
                placeholder="Cole o link do YouTube Shorts, vídeo normal ou Vimeo"
                name="url"
                value={videoForm.url}
                onChange={handleVideoChange}
              />
            </Form.Group>

            {/* Pré-visualização */}
            {videoForm.url?.trim() && (
              <div className="mb-3">
                {getEmbedUrl(videoForm.url) ? (
                  <>
                    <Form.Label>Pré-visualização do Vídeo</Form.Label>

                    <div
                      className="ratio ratio-16x9"
                      style={{
                        backgroundColor: "#000",
                        borderRadius: "8px",
                        overflow: "hidden"
                      }}
                    >
                      <iframe
                        src={getEmbedUrl(videoForm.url)}
                        title="Pré-visualização do vídeo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{
                          width: "100%",
                          height: "100%",
                          border: 0
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <small className="text-danger">
                    Link inválido ou formato não suportado.
                    Verifique o URL do vídeo.
                  </small>
                )}
              </div>
            )}


            {/* Pré-visualização do Vídeo */}





            {/* Campo URL do Google Drive */}
            <Form.Group className="mb-3">
              <Form.Label>URL do Google Drive</Form.Label>

              <Form.Control
                type="text"
                placeholder="Cole o link do vídeo no Google Drive"
                name="url_drive"
                value={videoForm.url_drive}
                onChange={handleVideoChange}
              />
            </Form.Group>

            {/* Botão para descarregar o vídeo */}






            {/* Campo Curso (opcional) */}
            <Form.Group className="mb-3">
              <Form.Label>Curso</Form.Label>
              <Form.Select
                name="courseId"
                value={videoForm.courseId}
                onChange={handleVideoChange}
              >
                <option value="">Selecione um curso</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVideoModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleVideoSave}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Edição de Perfil do Instrutor/Preparatório */}
      <UserProfileModal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        user={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser((prev) => ({ ...prev, ...updated }));
        }}
      />
    </div>
  );
}
// ultimo modal para adicionar video aula

