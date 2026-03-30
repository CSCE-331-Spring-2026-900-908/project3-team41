import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export default function LoginPage({ mode = "cashier" }) {
  const navigate = useNavigate();
  const isManager = mode === "manager";

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");

  const title = isManager ? "Manager Login" : "Employee Login";
  const submitLabel = isManager ? "Manager Login" : "Employee Login";
  const inputLabel = isManager ? "Enter Manager ID" : "Enter Employee ID";

  function clearStatus() {
    setStatus("");
    setStatusType("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearStatus();

    const parsedId = Number(employeeId.trim());
    if (!employeeId.trim() || Number.isNaN(parsedId)) {
      setStatus(`Please enter a numeric ${isManager ? "Manager" : "Employee"} ID.`);
      setStatusType("bad");
      return;
    }

    try {
      const endpoint = isManager ? "/api/login/manager" : "/api/login/employee";
      const payload = isManager
        ? { employeeId: parsedId, password }
        : { employeeId: parsedId };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Login failed.");
        setStatusType("bad");
        return;
      }

      setStatus(data.message);
      setStatusType("ok");

      localStorage.setItem("employeeId", String(parsedId));
      localStorage.setItem("employeeName", data.name || "");
      localStorage.setItem("role", isManager ? "manager" : "employee");

      navigate(isManager ? "/manager" : "/cashier");
    } catch (err) {
      setStatus("Server error occurred.");
      setStatusType("bad");
      console.error(err);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card login-card-single">
        <div className="login-header">
          <button className="secondary-btn" type="button" onClick={() => navigate("/")}>
            Back
          </button>
          <h1 className="page-title">{title}</h1>
          <p className="login-subtitle">
            {isManager
              ? "Sign in with a manager ID and password."
              : "Sign in with an employee ID to access the cashier screen."}
          </p>
        </div>

        <form className="login-pane login-pane-single" onSubmit={handleSubmit}>
          <label className="field-label">{inputLabel}</label>
          <input
            className="input"
            type="text"
            placeholder="e.g., 1"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />

          {isManager && (
            <>
              <label className="field-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}

          <button className="primary-btn" type="submit">
            {submitLabel}
          </button>
        </form>

        {status && (
          <p className={statusType === "ok" ? "status-ok" : "status-bad"}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
