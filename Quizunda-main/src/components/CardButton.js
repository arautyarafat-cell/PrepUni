// components/CardButton.jsx
import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Card, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./CardButton.css";

export default function CardButton({
  variant = "light",
  icon,
  title,
  label,
  path,
}) {
  const navigate = useNavigate();

  const handleNavigate = useCallback(() => {
    if (path) navigate(path);
  }, [navigate, path]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Abrir ${title}`}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className={`card-button text-center border-0 bg-${variant}`}
    >
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        {icon && <div className="card-icon">{icon}</div>}

        <Card.Title className="mt-3 fw-semibold">
          {title}
        </Card.Title>

        {label && (
          <Badge pill bg="light" text="dark" className="mt-2 px-3 py-1">
            {label}
          </Badge>
        )}
      </Card.Body>
    </Card>
  );
}

CardButton.propTypes = {
  variant: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  label: PropTypes.string,
  path: PropTypes.string.isRequired,
};
