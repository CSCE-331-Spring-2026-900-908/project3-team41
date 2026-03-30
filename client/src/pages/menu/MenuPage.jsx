import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CashierPage.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

const CATEGORY_ORDER = ["Classics", "Fruity", "Creamy", "Savory", "Specialties"];

function categoryLabel(rawCategory) {
  const value = (rawCategory || "").toLowerCase();
  if (value.includes("classic")) return "Classics";
  if (value.includes("fruit")) return "Fruity";
  if (value.includes("cream")) return "Creamy";
  if (value.includes("savory")) return "Savory";
  return "Specialties";
}

export default function MenuPage() {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/api/cashier/menu`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load menu.");
          return;
        }

        setMenuItems(data.items || []);
      } catch (err) {
        setError("Server error while loading menu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  const groupedMenu = useMemo(() => {
    const groups = CATEGORY_ORDER.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

    menuItems.forEach((item) => {
      const key = categoryLabel(item.category);
      groups[key].push(item);
    });

    return groups;
  }, [menuItems]);

  function goHome() {
    navigate("/");
  }

  return (
    <div className="cashier-root">
      <header className="cashier-header">
        <div>
          <h1 className="cashier-title">Menu</h1>
          <p className="cashier-subtitle">Browse our drinks</p>
        </div>
        <button className="cashier-logout" onClick={goHome} type="button">
          Back
        </button>
      </header>

      {loading && <p className="cashier-status">Loading menu...</p>}
      {!loading && error && <p className="cashier-error">{error}</p>}

      {!loading && !error && (
        <main style={{ display: "flex", justifyContent: "center" }}>
            <section className="cashier-menu" style={{ width: "100%", maxWidth: "1100px" }}>
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="menu-category">
                <h2>{category}</h2>
                <div className="menu-grid">
                  {groupedMenu[category].map((item) => (
                    <div
                      key={`${item.productId}-${item.itemName}`}
                      className="menu-item"
                      style={{ cursor: "default" }}
                    >
                      <span className="menu-item-name">{item.itemName}</span>
                      <span className="menu-item-price">
                        ${Number(item.effectivePrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      )}
    </div>
  );
}