import { useParams, useNavigate } from "react-router-dom";
import AnalyticsPage from "./AnalyticsPage";
import InventoryPage from "./InventoryPage";
import MenuPage from "./MenuPage";
import EmployeesPage from "./EmployeesPage";
import "../../styles/manager.css"; 

export default function ManagerNav() {
  const { page } = useParams();
  const navigate = useNavigate();

  const pages = {
    analytics: AnalyticsPage,
    inventory: InventoryPage,
    menu: MenuPage,
    employees: EmployeesPage
  };

  // Handles name mismatches
  const ActivePage = pages[page?.toLowerCase()] || null;

  // Goes to analytics by default
  if (!ActivePage) {
    navigate("/manager/analytics", { replace: true });
    return null;
  }

  // Switching between pages
  return (
    <div className="manager-root">
      <Sidebar active={page} onSelect={(p) => navigate(`/manager/${p}`)} />
      <div className="manager-content">
        <ActivePage />
      </div>
    </div>
  );
}

// Creates a functional sidebar
function Sidebar({ active, onSelect }) {
  const buttons = ["analytics", "inventory", "employees", "menu"];

  return (
    <div className="manager-sidebar">
      {buttons.map((b) => (
        <button
          key={b}
          className={active === b ? "active" : ""}
          onClick={() => onSelect(b)}
        >
          {b.charAt(0).toUpperCase() + b.slice(1)}
        </button>
      ))}
    </div>
  );
}