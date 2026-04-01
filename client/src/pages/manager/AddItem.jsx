import { useState, useEffect } from "react";

export default function AddItemModal({ item, onSave, onClose }) {
  const [name, setName] = useState(item?.ingredientName || "");
  const [qty, setQty] = useState(item?.quantity?.toString() || "");
  const [price, setPrice] = useState(item?.price?.toString() || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(item?.ingredientName || "");
    setQty(item?.quantity?.toString() || "");
    setPrice(item?.price?.toString() || "");
  }, [item]);

  // Sets errors when trying to add items
  const handleSave = async () => {
    setError("");

    if (!name.trim()) {
      setError("Ingredient name is required.");
      return;
    }

    const parsedQty = parseFloat(qty);
    if (Number.isNaN(parsedQty) || parsedQty < 0) {
      setError("Quantity must be a valid non-negative number.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim(), parsedQty, parsedPrice, item?.inventoryId);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className="modal-overlay manager-modal-overlay">
      <div className="modal manager-modal">
        <div className="modal-header manager-modal-header">
          <h2 className="modal-title manager-modal-title">
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </h2>
          <button className="modal-close" onClick={onClose}>?</button>
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
            {saving ? "Saving�" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
