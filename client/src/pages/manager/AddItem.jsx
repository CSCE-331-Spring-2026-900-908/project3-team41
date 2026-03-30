import { useState } from "react";

export default function AddItemModal({ onSave, onClose }) {
  const [name, setName]   = useState("");
  const [qty, setQty]     = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");

    if (!name.trim()) {
      setError("Ingredient name is required.");
      return;
    }

    const parsedQty = parseFloat(qty);
    if (isNaN(parsedQty) || parsedQty < 0) {
      setError("Quantity must be a valid non-negative number.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim(), parsedQty, parsedPrice);
      onClose();
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Allow pressing Enter in any field to submit
  const onKey = (e) => { if (e.key === "Enter") handleSave(); };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Add Inventory Item</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <label style={styles.label}>Ingredient name</label>
          <input
            style={styles.input}
            placeholder="e.g. Tapioca Pearls"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />

          <label style={styles.label}>Quantity</label>
          <input
            style={styles.input}
            placeholder="e.g. 50"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={onKey}
          />

          <label style={styles.label}>Price</label>
          <input
            style={styles.input}
            placeholder="e.g. 1.25"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={onKey}
          />

          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.footer}>
          <button
            style={{ ...styles.btnSave, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 120 },
  modal: { background: "#d9d9d9", borderRadius: 14, width: 420, maxWidth: "95vw", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px 12px" },
  title: { margin: 0, fontSize: 20, fontWeight: 600 },
  close: { background: "#ff4444", border: "none", color: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13, fontWeight: 700 },
  body: { padding: "4px 20px 8px", display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 2 },
  input: { padding: "9px 12px", borderRadius: 8, border: "1px solid #bbb", fontSize: 14, background: "#fff", outline: "none" },
  error: { color: "#b00020", fontSize: 13, margin: "4px 0 0" },
  footer: { padding: "12px 20px 18px" },
  btnSave: { width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#000", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
};