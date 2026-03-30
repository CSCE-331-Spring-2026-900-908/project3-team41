import { useState, useEffect, useCallback } from "react";
import RestockModal from "./RestockModal";
import ConfirmationModal from "./ConfirmationModal";
import AddItemModal from "./AddItemModal";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [selectedForOrder, setSelectedForOrder] = useState({});
  const [showRestock, setShowRestock] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
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

  const handleAddItem = async (name, qty, price) => {
    await fetch(`${API_URL}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientName: name, quantity: qty, price }),
    });
    await reload();
  };

  const handleRemove = async (inventoryId) => {
    if (!window.confirm("Remove this item?")) return;
    await fetch(`${API_URL}/inventory/${inventoryId}`, { method: "DELETE" });
    await reload();
  };

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

  const toggleSelection = (item) => {
    setSelectedForOrder((prev) => {
      const next = { ...prev };
      if (next[item.inventoryId]) {
        delete next[item.inventoryId];
      } else {
        next[item.inventoryId] = { ...item, restockQty: 1 };
      }
      return next;
    });
  };

  const fmt = (n) =>
    Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Inventory</h1>
        <div style={styles.actions}>
          <button style={styles.btnSecondary} onClick={() => setShowAddItem(true)}>
            + Add Item
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowRestock(true)}>
            Restock
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>Error: {error}</p>}

      {loading ? (
        <p style={styles.muted}>Loading…</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Ingredient</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.inventoryId} style={styles.tr}>
                  <td style={styles.td}>{item.inventoryId}</td>
                  <td style={styles.td}>{item.ingredientName}</td>
                  <td style={styles.td}>{Number(item.quantity).toFixed(2)}</td>
                  <td style={styles.td}>{fmt(item.price)}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button
                      style={styles.btnDanger}
                      onClick={() => handleRemove(item.inventoryId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, ...styles.muted, textAlign: "center" }}>
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showRestock && (
        <RestockModal
          inventory={inventory}
          selected={selectedForOrder}
          onToggle={toggleSelection}
          onCheckout={() => setShowConfirm(true)}
          onClose={() => setShowRestock(false)}
        />
      )}

      {showConfirm && (
        <ConfirmationModal
          selected={selectedForOrder}
          onChange={setSelectedForOrder}
          onConfirm={handleRestock}
          onClose={() => setShowConfirm(false)}
        />
      )}

      {showAddItem && (
        <AddItemModal
          onSave={handleAddItem}
          onClose={() => setShowAddItem(false)}
        />
      )}
    </div>
  );
}

const styles = {
  page: { padding: "32px", fontFamily: "sans-serif", maxWidth: 900 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 600, margin: 0 },
  actions: { display: "flex", gap: 10 },
  tableWrap: { border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 14px", background: "#f5f5f5", fontSize: 13, fontWeight: 600, color: "#555", borderBottom: "1px solid #ddd" },
  tr: { borderBottom: "1px solid #eee" },
  td: { padding: "10px 14px", fontSize: 14 },
  btnPrimary: { padding: "8px 16px", borderRadius: 8, border: "1px solid #222", background: "#222", color: "#fff", fontWeight: 500, cursor: "pointer" },
  btnSecondary: { padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", fontWeight: 500, cursor: "pointer" },
  btnDanger: { padding: "5px 12px", borderRadius: 6, border: "1px solid #f5c4c4", background: "#fff0f0", color: "#a32d2d", fontSize: 13, cursor: "pointer" },
  muted: { color: "#888", fontSize: 14 },
  error: { color: "#a32d2d", fontSize: 14 },
};

