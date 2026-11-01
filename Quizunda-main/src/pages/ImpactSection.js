import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/apiConfig";

function ImpactTitle() {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/user-count`)
      .then((res) => res.json())
      .then((data) => {
        // garanta que está pegando a chave certa
        setUserCount(data.count);
      })
      .catch((err) => console.error("Erro ao buscar usuários:", err));
  }, []);

  return (
    <div className="impact-section">
      <h2 className="impact-title">
        Mais de{" "}
        <span className="user-count">
          {typeof userCount === "number" ? userCount.toLocaleString("pt-PT") : "0"}
        </span>{" "}
        estudantes já fazem parte da nossa comunidade!
      </h2>

      <p className="impact-subtitle">
        Junte-se a nós e faça parte desta rede de estudantes que estão a transformar o futuro!
      </p>
    </div>
  );
}

export default ImpactTitle;
