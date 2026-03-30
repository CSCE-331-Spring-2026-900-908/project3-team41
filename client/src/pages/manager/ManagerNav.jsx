import { useParams, useNavigate } from "react-router-dom";
import AnalyticsPage from "./AnalyticsPage";
import InventoryPage from "./InventoryPage";
import MenuPage from "./MenuPage";
import EmployeesPage from "./EmployeesPage";

export default function ManagerNav() {
  const { page } = useParams();
  const navigate = useNavigate();

  const pages = {
    analytics: AnalyticsPage,
    inventory: InventoryPage,
    menu: MenuPage,
    employees: EmployeesPage
  };

  const ActivePage = pages[page?.toLowerCase()] || null;

  if (!ActivePage) {
    navigate("/manager/analytics", { replace: true });
    return null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active={page} onSelect={(p) => navigate(`/manager/${p}`)} />
      <div style={{ flex: 1, padding: 32, background: "#f9f9f9" }}>
        <ActivePage />
      </div>
    </div>
  );
}

function Sidebar({ active, onSelect }) {
  const styleButton = (isActive) => ({
    display: "block",
    padding: "12px 16px",
    width: "100%",
    background: isActive ? "#444" : "#222",
    color: "white",
    textAlign: "left",
    border: "none",
    cursor: "pointer",
    fontWeight: isActive ? "bold" : "normal",
    marginBottom: 2,
  });

  return (
    <div style={{ width: 200, background: "#222" }}>
      <button style={styleButton(active === "analytics")} onClick={() => onSelect("analytics")}>
        Analytics
      </button>
      <button style={styleButton(active === "inventory")} onClick={() => onSelect("inventory")}>
        Inventory
      </button>
      <button style={styleButton(active === "employees")} onClick={() => onSelect("employees")}>
        Employees
      </button>
      <button style={styleButton(active === "menu")} onClick={() => onSelect("menu")}>
        Menu
      </button>
    </div>
  );
}