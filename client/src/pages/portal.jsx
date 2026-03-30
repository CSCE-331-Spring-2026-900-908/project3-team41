import { useNavigate } from "react-router-dom";
import "../styles/portal.css";

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div className="portal-root">
      <div className="portal-card">
        <h1 className="portal-title">Boba Tea</h1>

        <div className="portal-button-grid">
          <button className="portal-btn" onClick={() => navigate("/cashier/login")}>
            Cashier
          </button>

          <button className="portal-btn" onClick={() => navigate("/customer")}>
            Customer
          </button>

          <button className="portal-btn" onClick={() => navigate("/manager/login")}>
            Manager
          </button>

          <button className="portal-btn" onClick={() => navigate("/menu")}>
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

