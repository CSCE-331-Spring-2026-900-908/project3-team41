import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [managerPassword, setManagerPassword] = useState("");

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "ok" or "bad"

  function clearStatus() {
    setStatus("");
    setStatusType("");
  }

  async function handleEmployeeLogin(e) {
    e.preventDefault();
    clearStatus();

    const parsedId = Number(employeeId.trim());

    if (!employeeId.trim() || Number.isNaN(parsedId)) {
      setStatus("Please enter a numeric Employee ID.");
      setStatusType("bad");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login/employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ employeeId: parsedId })
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
      localStorage.setItem("role", "employee");

      navigate("/cashier");
    } catch (err) {
      setStatus("Server error occurred.");
      setStatusType("bad");
      console.error(err);
    }
  }

  async function handleManagerLogin(e) {
    e.preventDefault();
    clearStatus();

    const parsedId = Number(managerId.trim());

    if (!managerId.trim() || Number.isNaN(parsedId)) {
      setStatus("Please enter a numeric Manager ID.");
      setStatusType("bad");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login/manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employeeId: parsedId,
          password: managerPassword
        })
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
      localStorage.setItem("role", "manager");

      navigate("/manager");
    } catch (err) {
      setStatus("Server error occurred.");
      setStatusType("bad");
      console.error(err);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <h1 className="page-title">Login</h1>
        <hr />

        <div className="login-sections">
          <form className="login-pane" onSubmit={handleEmployeeLogin}>
            <h2 className="section-title">Employee Login</h2>
            <label className="field-label">Enter Employee ID</label>
            <input
              className="input"
              type="text"
              placeholder="e.g., 0"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
            <button className="primary-btn" type="submit">
              Login
            </button>
          </form>

          <form className="login-pane" onSubmit={handleManagerLogin}>
            <h2 className="section-title">Manager Login</h2>
            <label className="field-label">Enter Employee ID</label>
            <input
              className="input"
              type="text"
              placeholder="e.g., 0"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
            />

            <label className="field-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="********"
              value={managerPassword}
              onChange={(e) => setManagerPassword(e.target.value)}
            />

            <button className="primary-btn" type="submit">
              Login
            </button>
          </form>
        </div>

        {status && (
          <p className={statusType === "ok" ? "status-ok" : "status-bad"}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}