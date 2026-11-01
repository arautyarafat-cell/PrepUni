import React, { useState, useEffect, useRef, useContext } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { API_BASE_URL, getUploadUrl } from "../config/apiConfig";
import { AuthContext } from "../context/AuthContext";

export default function UserProfileModal({ show, onHide, user, onProfileUpdated }) {
  const { updateUser } = useContext(AuthContext) || {};
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && user) {
      setName(user.name || user.username || "");
      setEmailOrPhone(user.emailOrPhone || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setPassword("");
      setAvatarFile(null);
      setRemoveAvatar(false);
      setErrorMsg("");
      setSuccessMsg("");

      if (user.avatar) {
        setAvatarPreview(getUploadUrl(user.avatar));
      } else {
        setAvatarPreview(null);
      }
    }
  }, [show, user]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WEBP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg("A imagem deve ter no máximo 10MB.");
        return;
      }
      setAvatarFile(file);
      setRemoveAvatar(false);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("O nome não pode ficar em branco.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken") || "";
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      formData.append("bio", bio.trim());
      if (password.trim()) {
        formData.append("password", password.trim());
      }

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (removeAvatar) {
        formData.append("avatar", "");
      }

      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Erro ao salvar perfil.");
      }

      setSuccessMsg("Perfil atualizado com sucesso!");

      if (data.user) {
        if (updateUser) {
          updateUser(data.user);
        } else {
          const currentLocal = JSON.parse(localStorage.getItem("user") || "{}");
          const nextLocal = { ...currentLocal, ...data.user };
          localStorage.setItem("user", JSON.stringify(nextLocal));
        }
        if (onProfileUpdated) {
          onProfileUpdated(data.user);
        }
      }

      setTimeout(() => {
        onHide();
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Falha ao atualizar dados.");
    } finally {
      setLoading(false);
    }
  };

  const initials = (name || user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <i className="fa fa-user-edit text-primary"></i>
          <span>Editar Meu Perfil</span>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-2">
          {errorMsg && (
            <Alert variant="danger" dismissible onClose={() => setErrorMsg("")} className="py-2 small">
              {errorMsg}
            </Alert>
          )}
          {successMsg && (
            <Alert variant="success" className="py-2 small text-center fw-bold">
              <i className="fa fa-check-circle me-1"></i> {successMsg}
            </Alert>
          )}

          {/* Seção da Foto de Perfil */}
          <div className="d-flex flex-column align-items-center my-3">
            <div
              className="position-relative cursor-pointer shadow-sm mb-2"
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #0044fc",
                backgroundColor: "#eef2ff"
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Clique para trocar foto"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Foto do perfil"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      name || "User"
                    )}&background=0044fc&color=fff&size=160&bold=true`;
                  }}
                />
              ) : (
                <div
                  className="w-100 h-100 d-flex align-items-center justify-content-center text-primary fw-bold"
                  style={{ fontSize: "36px" }}
                >
                  {initials}
                </div>
              )}

              {/* Overlay com ícone de câmera */}
              <div
                className="position-absolute bottom-0 start-0 w-100 py-1 text-center text-white"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                  fontSize: "11px",
                  backdropFilter: "blur(2px)"
                }}
              >
                <i className="fa fa-camera me-1"></i> Alterar
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              style={{ display: "none" }}
            />

            <div className="d-flex gap-2 mt-1">
              <Button
                variant="outline-primary"
                size="sm"
                className="px-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fa fa-upload me-1"></i> Inserir Foto
              </Button>
              {avatarPreview && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleRemovePhoto}
                  title="Remover foto atual"
                >
                  <i className="fa fa-trash"></i>
                </Button>
              )}
            </div>
            <small className="text-muted mt-1" style={{ fontSize: "11px" }}>
              Formatos aceitos: JPG, PNG, WEBP (Máx: 10MB)
            </small>
          </div>

          {/* Campos de Dados */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small text-muted">
              Nome Completo <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small text-muted">E-mail ou Usuário</Form.Label>
            <Form.Control
              type="text"
              value={emailOrPhone}
              disabled
              className="bg-light text-muted"
            />
            <Form.Text className="text-muted" style={{ fontSize: "11px" }}>
              Identificador da conta (somente leitura).
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small text-muted">Telefone / WhatsApp</Form.Label>
            <Form.Control
              type="text"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small text-muted">Biografia / Apresentação</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Fale um pouco sobre seus objetivos ou formação..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small text-muted">Nova Senha (opcional)</Form.Label>
            <Form.Control
              type="password"
              placeholder="Deixe em branco se não desejar alterar"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="px-4 fw-bold">
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Salvando...
              </>
            ) : (
              <>
                <i className="fa fa-save me-1"></i> Salvar Perfil
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
