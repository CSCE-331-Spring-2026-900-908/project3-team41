export default function RestockModal({ inventory, selected, onToggle, onCheckout, onClose }) {
  const isSelected = (item) => !!selected[item.inventoryId];

    return (
    <div className="modal-overlay restock-overlay">
      <div className="modal restock-modal">
        <div className="modal-header restock-header">
          <h2 className="modal-title restock-title">Restock Inventory</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
 
        <div className="modal-body-scroll">
          <table className="restock-table">
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
                <tr
                  key={item.inventoryId}
                  className={`restock-row${isSelected(item) ? " selected" : ""}`}
                >
                  <td>{item.inventoryId}</td>
                  <td>{item.ingredientName}</td>
                  <td>{Number(item.quantity).toFixed(2)}</td>
                  <td>
                    {Number(item.price).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                  <td className="restock-td-right">
                    <button
                      className={isSelected(item) ? "restock-btn-selected" : "restock-btn-add"}
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
 
        <div className="restock-footer">
          <span className="restock-count">
            {Object.keys(selected).length} item(s) selected
          </span>
          <button
            className="modal-btn-action restock-btn-checkout"
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