import React, { useState } from "react";
import { Form, FormControl, Button, InputGroup } from "react-bootstrap";

export default function CoursesSearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
      <Form onSubmit={handleSubmit} style={{ width: "60%" }}>
        <InputGroup>
          <FormControl
            type="search"
            placeholder="Pesquisar cursos..."
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              padding: "10px 15px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "linear-gradient(145deg, #ffffff, #e6e6e6)",
              boxShadow: "4px 4px 8px #b3b3b3, -4px -4px 8px #ffffff",
              ouline: "none",
              fontSize: "16px"

            }}
          />
          <Button
            type="submit"
            style={{
              backgroundColor: "#000000", // amarelo ouro
              
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "14px 28px",
              fontWeight: "bold",
              transition: "0.3s"
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#000000")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#000000")}
          >
            Buscar
          </Button>
        </InputGroup>
      </Form>
    </div>
  );
}
