import { useState, useEffect, useCallback } from "react";
import RestockModal from "./Restock";
import ConfirmationModal from "./Confirmation";
import AddItemModal from "./AddItem";
import "../../styles/manager.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [selectedForOrder, setSelectedForOrder] = useState({});
  const [showRestock, setShowRestock] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/inventory`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Add items to inventory
  const handleSaveItem = async (name, qty, price, inventoryId) => {
    const method = inventoryId ? "PATCH" : "POST";
    const url = inventoryId ? `${API_URL}/inventory/${inventoryId}` : `${API_URL}/inventory`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientName: name, quantity: qty, price }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server responded ${res.status}`);
    }

    await reload();
  };

  // Remove items from inventory
  const handleRemove = async (inventoryId) => {
    if (!window.confirm("Remove this item?")) return;
    await fetch(`${API_URL}/inventory/${inventoryId}`, { method: "DELETE" });
    await reload();
  };

  const openAddItem = () => {
    setEditingItem(null);
    setShowAddItem(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setShowAddItem(true);
  };

  const closeAddItem = () => {
    setEditingItem(null);
    setShowAddItem(false);
  };

  // Restock inventory items
  const handleRestock = async () => {
    for (const item of Object.values(selectedForOrder)) {
      await fetch(`${API_URL}/inventory/${item.inventoryId}/restock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: item.restockQty }),
      });
    }
    setSelectedForOrder({});
    setShowConfirm(false);
    setShowRestock(false);
    await reload();
  };

  // Shows which inventory item is selected
  const toggleSelection = (item) => {
    setSelectedForOrder((prev) => {
      const next = { ...prev };
      if (next[item.inventoryId]) delete next[item.inventoryId];
      else next[item.inventoryId] = { ...item, restockQty: 1 };
      return next;
    });
  };

  const fmt = (n) =>
    Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

  // Actual layout of page
  return (
    <div className="manager-page">
      <div className="manager-header">
        <h1 className="manager-title">Inventory</h1>
        <div className="manager-actions">
          <button className="btn-secondary" onClick={openAddItem}>+ Add Item</button>
          <button className="btn-primary" onClick={() => setShowRestock(true)}>Restock</button>
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
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.inventoryId}>
                  <td>{item.inventoryId}</td>
                  <td>{item.ingredientName}</td>
                  <td>{Number(item.quantity).toFixed(2)}</td>
                  <td>{fmt(item.price)}</td>
                  <td className="text-right">
                    <button className="btn-secondary" onClick={() => openEditItem(item)}>Edit</button>
                    <button className="btn-danger" onClick={() => handleRemove(item.inventoryId)}>Remove</button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center muted">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showRestock && <RestockModal inventory={inventory} selected={selectedForOrder} onToggle={toggleSelection} onCheckout={() => setShowConfirm(true)} onClose={() => setShowRestock(false)} />}
      {showConfirm && <ConfirmationModal selected={selectedForOrder} onChange={setSelectedForOrder} onConfirm={handleRestock} onClose={() => setShowConfirm(false)} />}
      {showAddItem && <AddItemModal item={editingItem} onSave={handleSaveItem} onClose={closeAddItem} />}
    </div>
  );
}

