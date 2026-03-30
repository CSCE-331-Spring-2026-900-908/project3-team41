import { useState } from "react";

export default function AddItemModal({ onSave, onClose }) {
  const [name, setName]   = useState("");
  const [qty, setQty]     = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Saving the added item
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
    <div className="modal-overlay manager-modal-overlay">
      <div className="modal manager-modal">
        <div className="modal-header manager-modal-header">
          <h2 className="modal-title manager-modal-title">Add Inventory Item</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
 
        <div className="manager-modal-body">
          <label className="manager-modal-label">Ingredient name</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. Tapioca Pearls"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />
 
          <label className="manager-modal-label">Quantity</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. 50"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={onKey}
          />
 
          <label className="manager-modal-label">Price</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. 1.25"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={onKey}
          />
 
          {error && <p className="manager-modal-error">{error}</p>}
        </div>
 
        <div className="manager-modal-footer">
          <button
            className="modal-btn-action manager-modal-btn-save"
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