import { useCallback, useEffect, useState } from "react";
import MenuItemModal from "./MenuItemModal";
import "../../styles/manager.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

function normalizeIngredients(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean).join(", ");
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed.slice(1, -1).split(",").map((entry) => entry.trim()).filter(Boolean).join(", ");
  }

  return trimmed;
}

function formatCurrency(value) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDiscount(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  });
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/manager/menu`);
      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }

      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      setError(err.message || "Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSaveMenuItem = async (item) => {
    const isEdit = Boolean(item.productId);
    const url = isEdit
      ? `${API_URL}/api/manager/menu/${item.productId}`
      : `${API_URL}/api/manager/menu`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: item.category,
        itemName: item.itemName,
        ingredients: item.ingredients,
        price: item.price,
        discount: item.discount,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server responded ${res.status}`);
    }

    await reload();
  };

  const handleRemove = async (productId) => {
    if (!window.confirm("Remove this menu item?")) {
      return;
    }

    const res = await fetch(`${API_URL}/api/manager/menu/${productId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `Server responded ${res.status}`);
      return;
    }

    await reload();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="manager-page">
      <div className="manager-header">
        <h1 className="manager-title">Menu</h1>
        <div className="manager-actions">
          <button className="btn-secondary" onClick={openAddModal}>
            + Add Menu Item
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Item</th>
                <th>Ingredients</th>
                <th>Price</th>
                <th>Discount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productId}</td>
                  <td>{item.category}</td>
                  <td>{item.itemName}</td>
                  <td>{normalizeIngredients(item.ingredients)}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatDiscount(item.discount)}</td>
                  <td className="text-right">
                    <button className="btn-secondary" onClick={() => openEditModal(item)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleRemove(item.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {menuItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center muted">
                    No menu items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <MenuItemModal
          initialItem={editingItem}
          onSave={handleSaveMenuItem}
          onClose={closeModal}
        />
      )}
    </div>
  );
}