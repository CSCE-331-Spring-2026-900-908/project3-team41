export default function ConfirmationModal({ selected, onChange, onConfirm, onClose }) {
  const items = Object.values(selected);

  // Updating database with new quantity
  const changeQty = (inventoryId, delta) => {
    onChange((prev) => {
      const item = prev[inventoryId];
      const newQty = Math.max(1, item.restockQty + delta);
      return { ...prev, [inventoryId]: { ...item, restockQty: newQty } };
    });
  };

  const removeItem = (inventoryId) => {
    onChange((prev) => {
      const next = { ...prev };
      delete next[inventoryId];
      return next;
    });
  };

  const total = items.reduce((sum, item) => sum + item.price * item.restockQty, 0);

  const fmt = (n) =>
    Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="modal-overlay confirm-overlay">
      <div className="modal confirm-modal">
        <div className="modal-header confirm-header">
          <h2 className="modal-title confirm-title">Order Confirmation</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
 
        <div className="modal-body-scroll confirm-body">
          {items.length === 0 ? (
            <p className="confirm-empty">No items selected.</p>
          ) : (
            items.map((item) => (
              <div key={item.inventoryId} className="confirm-row">
                <span className="confirm-name">{item.ingredientName}</span>
 
                <div className="confirm-qty-controls">
                  <button
                    className="confirm-qty-btn"
                    disabled={item.restockQty <= 1}
                    onClick={() => changeQty(item.inventoryId, -1)}
                  >
                    −
                  </button>
                  <span className="confirm-qty">{item.restockQty}</span>
                  <button
                    className="confirm-qty-btn"
                    onClick={() => changeQty(item.inventoryId, 1)}
                  >
                    +
                  </button>
                </div>
 
                <span className="confirm-line-total">{fmt(item.price * item.restockQty)}</span>
 
                <button className="confirm-remove-btn" onClick={() => removeItem(item.inventoryId)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
 
        <div className="confirm-footer">
          <button
            className="modal-btn-action confirm-btn-checkout"
            disabled={items.length === 0}
            onClick={onConfirm}
          >
            Checkout {items.length > 0 ? fmt(total) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}