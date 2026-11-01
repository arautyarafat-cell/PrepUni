import React, { useEffect, useState } from "react";
import { Row, Col, Badge } from "react-bootstrap";
import { API_BASE_URL } from "../config/apiConfig";

function parsePropData(data) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Consolidação de disciplinas a partir dos exames realizados
  const discMap = {};

  data.forEach((exame) => {
    const list = Array.isArray(exame.disciplinas) ? exame.disciplinas : [];
    list.forEach((d) => {
      const nome = d.nome || d.disciplina || "Geral";
      const acertos = Number(d.respondidas ?? d.acertos ?? 0);
      const erros = Number(d.naoRespondidas ?? d.errados ?? d.erros ?? 0);

      if (!discMap[nome]) {
        discMap[nome] = { nome, acertos: 0, erros: 0, total: 0 };
      }
      discMap[nome].acertos += acertos;
      discMap[nome].erros += erros;
      discMap[nome].total += acertos + erros;
    });
  });

  const keys = Object.keys(discMap);
  if (keys.length > 0) {
    return keys.map((nome) => {
      const item = discMap[nome];
      const percentual =
        item.total > 0 ? Math.round((item.acertos / item.total) * 100) : 0;
      return {
        nome,
        acertos: item.acertos,
        erros: item.erros,
        total: item.total,
        percentual
      };
    });
  }

  // Se já for diretamente uma lista de disciplinas [ { nome, percentual, ... } ]
  if (data[0]?.nome || data[0]?.disciplina) {
    return data.map((d) => {
      const acertos = Number(d.respondidas ?? d.acertos ?? 0);
      const erros = Number(d.naoRespondidas ?? d.errados ?? d.erros ?? 0);
      const total = d.total ? Number(d.total) : acertos + erros;
      const percentual =
        d.percentual !== undefined
          ? Math.round(Number(d.percentual))
          : total > 0
            ? Math.round((acertos / total) * 100)
            : 0;
      return {
        nome: d.nome || d.disciplina || "Geral",
        percentual,
        acertos,
        erros,
        total
      };
    });
  }

  return null;
}

export default function ExamVerticalHistogram({ data }) {
  const initialData = parsePropData(data) || [];
  const [disciplinas, setDisciplinas] = useState(initialData);

  // Paleta de gradientes modernos
  const colors = [
    { bar: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)", text: "#1d4ed8" },
    { bar: "linear-gradient(180deg, #10b981 0%, #059669 100%)", text: "#059669" },
    { bar: "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)", text: "#d97706" },
    { bar: "linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)", text: "#6d28d9" },
    { bar: "linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)", text: "#0891b2" }
  ];

  // Atualiza se a prop data mudar com simulados reais
  useEffect(() => {
    const parsed = parsePropData(data);
    if (parsed) {
      setDisciplinas(parsed);
    } else if (Array.isArray(data) && data.length === 0) {
      setDisciplinas([]);
    }
  }, [data]);

  // Busca estatísticas consolidadas salvas no servidor
  useEffect(() => {
    const fetchEstatisticas = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token =
          localStorage.getItem("token") ||
          (storedUser ? JSON.parse(storedUser).token : null);

        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/estatisticas`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const apiData = await res.json();
        if (Array.isArray(apiData) && apiData.length > 0) {
          const formatadas = apiData.map((item) => {
            const acertos = Number(item.acertos || 0);
            const erros = Number(item.errados || item.erros || 0);
            const total = Number(item.total || acertos + erros);
            const percentual =
              item.percentual !== undefined
                ? Math.round(Number(item.percentual))
                : total > 0
                  ? Math.round((acertos / total) * 100)
                  : 0;

            return {
              nome: item.disciplina || item.nome,
              percentual,
              acertos,
              erros,
              total
            };
          });

          setDisciplinas(formatadas);
        }
      } catch (err) {
        console.warn("Aviso ao buscar estatísticas do servidor:", err);
      }
    };

    fetchEstatisticas();
  }, []);

  const mediaGeral =
    disciplinas.length > 0
      ? Math.round(
        disciplinas.reduce((acc, curr) => acc + (curr.percentual || 0), 0) /
        disciplinas.length
      )
      : 0;

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px 20px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}
    >
      {/* Resumo no topo do gráfico */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <span className="small text-muted fw-semibold">
          Aproveitamento Médio:{" "}
          <strong className="text-primary fs-6">{mediaGeral}%</strong>
        </span>
        <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1">
          {disciplinas.length} {disciplinas.length === 1 ? "disciplina" : "disciplinas"}
        </Badge>
      </div>

      {disciplinas.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-3 border">
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 68, 252, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px"
            }}
          >
            <i className="fa fa-chart-bar fa-2x text-primary opacity-75"></i>
          </div>
          <h6 className="fw-bold text-dark mb-1">Nenhum simulado registrado</h6>
          <p className="text-muted small mb-0" style={{ maxWidth: "340px", margin: "0 auto" }}>
            Realize um simulado para que seu percentual de acertos e desempenho por matéria apareçam aqui.
          </p>
        </div>
      ) : (
        /* Área das Barras Verticais */
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "4px"
          }}
        >
          <div style={{ minWidth: disciplinas.length > 4 ? `${disciplinas.length * 85}px` : "100%" }}>
            <Row
              className="justify-content-around align-items-end flex-nowrap g-2"
              style={{ height: "240px", margin: 0 }}
            >
              {disciplinas.map((item, i) => {
                const colorObj = colors[i % colors.length];
                const pct = Math.min(100, Math.max(0, item.percentual || 0));

                return (
                  <Col
                    key={i}
                    className="text-center d-flex flex-column justify-content-end align-items-center"
                    style={{ padding: "0 6px", flex: 1, minWidth: "68px" }}
                  >
                    {/* Percentual em destaque acima da barra */}
                    <div
                      style={{
                        marginBottom: "6px",
                        fontWeight: "800",
                        fontSize: "12px",
                        color: colorObj.text
                      }}
                    >
                      {pct}%
                    </div>

                    {/* Trilho da barra + Preenchimento vertical */}
                    <div
                      style={{
                        backgroundColor: "#f1f5f9",
                        height: "150px",
                        width: "100%",
                        maxWidth: "44px",
                        borderRadius: "8px 8px 4px 4px",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        overflow: "hidden",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)"
                      }}
                      title={`${item.nome}: ${pct}% (${item.acertos ?? 0} acertos / ${item.total ?? 0} questões)`}
                    >
                      <div
                        style={{
                          background: colorObj.bar,
                          height: `${Math.max(6, pct)}%`,
                          width: "100%",
                          borderRadius: "6px 6px 0 0",
                          transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                      />
                    </div>

                    {/* Nome da Disciplina e Acertos abaixo da barra */}
                    <div style={{ marginTop: "8px", width: "100%", lineHeight: "1.2" }}>
                      <div
                        className="text-truncate fw-bold"
                        style={{
                          fontSize: "11px",
                          color: "#1e293b",
                          maxWidth: "85px",
                          margin: "0 auto"
                        }}
                        title={item.nome}
                      >
                        {item.nome}
                      </div>
                      {item.total !== undefined && item.total > 0 && (
                        <div
                          className="text-muted"
                          style={{ fontSize: "10px", marginTop: "2px" }}
                        >
                          {item.acertos}/{item.total} acertos
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>
      )}
    </div>
  );
}
