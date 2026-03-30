export default function ConfirmationModal({ selected, onChange, onConfirm, onClose }) {
  const items = Object.values(selected);

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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Order Confirmation</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {items.length === 0 ? (
            <p style={styles.empty}>No items selected.</p>
          ) : (
            items.map((item) => (
              <div key={item.inventoryId} style={styles.row}>
                <span style={styles.name}>{item.ingredientName}</span>

                <div style={styles.qtyControls}>
                  <button
                    style={styles.qtyBtn}
                    disabled={item.restockQty <= 1}
                    onClick={() => changeQty(item.inventoryId, -1)}
                  >
                    −
                  </button>
                  <span style={styles.qty}>{item.restockQty}</span>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => changeQty(item.inventoryId, 1)}
                  >
                    +
                  </button>
                </div>

                <span style={styles.lineTotal}>{fmt(item.price * item.restockQty)}</span>

                <button style={styles.removeBtn} onClick={() => removeItem(item.inventoryId)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          <button
            style={{
              ...styles.btnCheckout,
              opacity: items.length === 0 ? 0.45 : 1,
              cursor: items.length === 0 ? "not-allowed" : "pointer",
            }}
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

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 },
  modal: { background: "#e8e8e8", borderRadius: 12, width: 720, maxWidth: "95vw", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px", borderBottom: "1px solid #ccc" },
  title: { margin: 0, fontSize: 18, fontWeight: 600 },
  close: { background: "#ff4444", border: "none", color: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13, fontWeight: 700 },
  body: { flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 },
  empty: { color: "#888", fontSize: 15, textAlign: "center", margin: "24px 0" },
  row: { display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 12px" },
  name: { flex: 1, fontSize: 15, fontWeight: 500 },
  qtyControls: { display: "flex", alignItems: "center", gap: 6 },
  qtyBtn: { width: 30, height: 30, border: "none", background: "transparent", fontSize: 20, cursor: "pointer", lineHeight: 1, color: "#111", padding: 0 },
  qty: { minWidth: 24, textAlign: "center", fontSize: 16 },
  lineTotal: { minWidth: 70, textAlign: "right", fontSize: 15 },
  removeBtn: { background: "#ff4444", border: "none", color: "#fff", borderRadius: 8, width: 26, height: 26, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  footer: { padding: "14px 20px", borderTop: "1px solid #ccc" },
  btnCheckout: { width: "100%", padding: "14px", borderRadius: 9, border: "none", background: "#000", color: "#fff", fontWeight: 600, fontSize: 17 },
};