export default function RestockModal({ inventory, selected, onToggle, onCheckout, onClose }) {
  const isSelected = (item) => !!selected[item.inventoryId];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Restock Inventory</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

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
                <tr key={item.inventoryId} style={{
                  ...styles.tr,
                  background: isSelected(item) ? "#f0f7ff" : "transparent",
                }}>
                  <td style={styles.td}>{item.inventoryId}</td>
                  <td style={styles.td}>{item.ingredientName}</td>
                  <td style={styles.td}>{Number(item.quantity).toFixed(2)}</td>
                  <td style={styles.td}>
                    {Number(item.price).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button
                      style={isSelected(item) ? styles.btnSelected : styles.btnAdd}
                      onClick={() => onToggle(item)}
                    >
                      {isSelected(item) ? "Added ✓" : "ADD"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.footer}>
          <span style={styles.count}>
            {Object.keys(selected).length} item(s) selected
          </span>
          <button
            style={{
              ...styles.btnCheckout,
              opacity: Object.keys(selected).length === 0 ? 0.45 : 1,
              cursor: Object.keys(selected).length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={Object.keys(selected).length === 0}
            onClick={onCheckout}
          >
            Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: 14, width: 760, maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px", borderBottom: "1px solid #eee" },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  close: { background: "#ff4444", border: "none", color: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13, fontWeight: 700 },
  tableWrap: { overflowY: "auto", flex: 1 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 14px", background: "#f8f8f8", fontSize: 13, fontWeight: 600, color: "#555", borderBottom: "1px solid #eee", position: "sticky", top: 0 },
  tr: { borderBottom: "1px solid #f0f0f0", transition: "background 0.15s" },
  td: { padding: "10px 14px", fontSize: 14 },
  btnAdd: { padding: "5px 14px", borderRadius: 8, border: "1px solid #222", background: "#f5f5f5", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  btnSelected: { padding: "5px 14px", borderRadius: 8, border: "1px solid #6b6b6b", background: "#bdbdbd", fontWeight: 600, cursor: "pointer", fontSize: 13, color: "#333" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderTop: "1px solid #eee" },
  count: { fontSize: 14, color: "#777" },
  btnCheckout: { padding: "9px 22px", borderRadius: 9, border: "none", background: "#222", color: "#fff", fontWeight: 600, fontSize: 15 },
};