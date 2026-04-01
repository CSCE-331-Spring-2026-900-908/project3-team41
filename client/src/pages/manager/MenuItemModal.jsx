import { useEffect, useState } from "react";

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

export default function MenuItemModal({ initialItem, onSave, onClose }) {
  const [category, setCategory] = useState(initialItem?.category || "");
  const [itemName, setItemName] = useState(initialItem?.itemName || "");
  const [ingredients, setIngredients] = useState(normalizeIngredients(initialItem?.ingredients));
  const [price, setPrice] = useState(initialItem?.price?.toString() || "");
  const [discount, setDiscount] = useState(initialItem?.discount?.toString() || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategory(initialItem?.category || "");
    setItemName(initialItem?.itemName || "");
    setIngredients(normalizeIngredients(initialItem?.ingredients));
    setPrice(initialItem?.price?.toString() || "");
    setDiscount(initialItem?.discount?.toString() || "");
  }, [initialItem]);

  const handleSave = async () => {
    setError("");

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!ingredients.trim()) {
      setError("Ingredients are required.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    const parsedDiscount = parseFloat(discount);
    if (Number.isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 1) {
      setError("Discount must be a decimal between 0 and 1.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        productId: initialItem?.productId,
        category: category.trim(),
        itemName: itemName.trim(),
        ingredients: ingredients.trim(),
        price: parsedPrice,
        discount: parsedDiscount,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save menu item.");
    } finally {
      setSaving(false);
    }
  };

  const onKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSave();
    }
  };

  return (
    <div className="modal-overlay manager-modal-overlay">
      <div className="modal manager-modal">
        <div className="modal-header manager-modal-header">
          <h2 className="modal-title manager-modal-title">
            {initialItem ? "Edit Menu Item" : "Add Menu Item"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="manager-modal-body">
          <label className="manager-modal-label">Category</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. Classics"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />

          <label className="manager-modal-label">Item name</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. Classic Milk Tea"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onKeyDown={onKey}
          />

          <label className="manager-modal-label">Ingredients</label>
          <textarea
            className="manager-modal-input"
            placeholder="e.g. black tea, milk, tapioca pearls, sugar"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            style={{ resize: "vertical", minHeight: "88px" }}
          />

          <label className="manager-modal-label">Price</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. 5.25"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={onKey}
            inputMode="decimal"
          />

          <label className="manager-modal-label">Discount (decimal)</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. 0.10"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            onKeyDown={onKey}
            inputMode="decimal"
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