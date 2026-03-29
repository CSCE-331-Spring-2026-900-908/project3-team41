import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CashierPage.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

const CATEGORY_ORDER = ["Classics", "Fruity", "Creamy", "Savory", "Specialties"];
const SIZE_ADJUSTMENTS = { S: 0, M: 0.5, L: 1, XL: 1.5 };
const TOPPING_PRICES = {
  boba: 0.75,
  jellies: 0.75,
  poppingBoba: 0.75,
  doubleBoba: 1.25,
  extraMilk: 0.5,
  soyMilk: 0.5,
  blended: 0.5,
};

function categoryLabel(rawCategory) {
  const value = (rawCategory || "").toLowerCase();
  if (value.includes("classic")) return "Classics";
  if (value.includes("fruit")) return "Fruity";
  if (value.includes("cream")) return "Creamy";
  if (value.includes("savory")) return "Savory";
  return "Specialties";
}

function defaultCustomization() {
  return {
    size: "S",
    sugar: "+Sugar",
    ice: "+Ice",
    noToppings: false,
    boba: false,
    jellies: false,
    poppingBoba: false,
    doubleBoba: false,
    extraMilk: false,
    soyMilk: false,
    blended: false,
  };
}

function computeUnitPrice(basePrice, customization) {
  let total = Number(basePrice) + (SIZE_ADJUSTMENTS[customization.size] || 0);
  if (!customization.noToppings) {
    Object.entries(TOPPING_PRICES).forEach(([key, price]) => {
      if (customization[key]) total += price;
    });
  }
  return Number(total.toFixed(2));
}

function buildOptionsKey(customization) {
  const parts = [
    `size=${customization.size}`,
    `sugar=${customization.sugar}`,
    `ice=${customization.ice}`,
  ];

  if (customization.noToppings) {
    parts.push("noToppings=true");
  } else {
    if (customization.boba) parts.push("boba=true");
    if (customization.jellies) parts.push("jellies=true");
    if (customization.poppingBoba) parts.push("poppingBoba=true");
    if (customization.doubleBoba) parts.push("doubleBoba=true");
    if (customization.extraMilk) parts.push("extraMilk=true");
    if (customization.soyMilk) parts.push("soyMilk=true");
    if (customization.blended) parts.push("blended=true");
  }

  return `${parts.join(";")};`;
}

export default function CashierPage() {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employeeId") || "";
  const employeeName = localStorage.getItem("employeeName") || "Employee";

  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customizingItem, setCustomizingItem] = useState(null);
  const [customization, setCustomization] = useState(defaultCustomization());
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [paymentType, setPaymentType] = useState("CASH");
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/api/cashier/menu`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load menu.");
          return;
        }

        setMenuItems(data.items || []);
      } catch (err) {
        setError("Server error while loading menu.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const anyModalOpen = Boolean(customizingItem || checkoutOpen || paymentReceipt);

  useEffect(() => {
    if (!anyModalOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [anyModalOpen]);

  useEffect(() => {
    function onEsc(event) {
      if (event.key !== "Escape") return;
      if (paymentReceipt) {
        setPaymentReceipt(null);
        return;
      }
      if (checkoutOpen) {
        setCheckoutOpen(false);
        return;
      }
      if (customizingItem) {
        closeCustomization();
      }
    }

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [customizingItem, checkoutOpen, paymentReceipt]);

  const groupedMenu = useMemo(() => {
    const groups = CATEGORY_ORDER.reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});

    menuItems.forEach((item) => {
      const key = categoryLabel(item.category);
      groups[key].push(item);
    });

    return groups;
  }, [menuItems]);

  const cartTotal = useMemo(() => {
    const total = cartItems.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);
    return Number(total.toFixed(2));
  }, [cartItems]);

  const customizedUnitPrice = useMemo(() => {
    if (!customizingItem) return 0;
    return computeUnitPrice(customizingItem.effectivePrice, customization);
  }, [customizingItem, customization]);

  function addToCart(item, selectedCustomization) {
    const optionsKey = buildOptionsKey(selectedCustomization);
    const size = selectedCustomization.size;
    const unitPrice = computeUnitPrice(item.effectivePrice, selectedCustomization);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (x) => x.drinkName === item.itemName && x.size === size && x.optionsKey === optionsKey
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        const existing = next[existingIndex];
        next[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return next;
      }

      return [
        ...prev,
        {
          drinkName: item.itemName,
          size,
          optionsKey,
          quantity: 1,
          unitPrice,
        },
      ];
    });
  }

  function incrementAt(index) {
    setCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }

  function decrementAt(index) {
    setCartItems((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeAt(index) {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  }

  function logout() {
    localStorage.removeItem("employeeId");
    localStorage.removeItem("employeeName");
    localStorage.removeItem("role");
    navigate("/");
  }

  function startCustomization(item) {
    setCustomization(defaultCustomization());
    setCustomizingItem(item);
  }

  function closeCustomization() {
    setCustomizingItem(null);
  }

  function toggleCustomizationField(field, value) {
    setCustomization((prev) => {
      if (field === "noToppings") {
        if (value) {
          return {
            ...prev,
            noToppings: true,
            boba: false,
            jellies: false,
            poppingBoba: false,
            doubleBoba: false,
            extraMilk: false,
            soyMilk: false,
            blended: false,
          };
        }
        return { ...prev, noToppings: false };
      }

      if (
        ["boba", "jellies", "poppingBoba", "doubleBoba", "extraMilk", "soyMilk", "blended"].includes(field)
      ) {
        return { ...prev, noToppings: false, [field]: value };
      }

      return { ...prev, [field]: value };
    });
  }

  function confirmCustomization() {
    if (!customizingItem) return;
    addToCart(customizingItem, customization);
    setToast({ type: "ok", message: `${customizingItem.itemName} added to cart` });
    closeCustomization();
  }

  function effectiveCustomerId() {
    const parsed = Number(customerIdInput.trim());
    if (!customerIdInput.trim() || Number.isNaN(parsed) || parsed <= 0) return 1;
    return parsed;
  }

  async function submitCheckout() {
    if (cartItems.length === 0) return;

    const employeeIdNumber = Number(employeeId);
    if (Number.isNaN(employeeIdNumber) || employeeIdNumber <= 0) {
      setCheckoutError("Invalid employee session. Please log in again.");
      return;
    }

    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      const payload = {
        employeeId: employeeIdNumber,
        customerId: effectiveCustomerId(),
        paymentType,
        items: cartItems.map((item) => ({
          drinkName: item.drinkName,
          size: item.size,
          optionsKey: item.optionsKey,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await fetch(`${API_URL}/api/cashier/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckoutError(data.error || (data.errors ? data.errors.join(", ") : "Checkout failed"));
        return;
      }

      setPaymentReceipt(data);
      setCartItems([]);
      setCustomerIdInput("");
      setPaymentType("CASH");
      setCheckoutOpen(false);
      setToast({ type: "ok", message: "Checkout completed successfully" });
    } catch (err) {
      setCheckoutError("Server error during checkout.");
      setToast({ type: "bad", message: "Checkout failed. Please try again." });
      console.error(err);
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <div className="cashier-root">
      <header className="cashier-header">
        <div>
          <h1 className="cashier-title">Cashier</h1>
          <p className="cashier-subtitle">
            Employee: {employeeName} {employeeId ? `(#${employeeId})` : ""}
          </p>
        </div>
        <button className="cashier-logout" onClick={logout} type="button">
          Logout
        </button>
      </header>

      {loading && <p className="cashier-status">Loading menu...</p>}
      {!loading && error && <p className="cashier-error">{error}</p>}

      {!loading && !error && (
        <main className="cashier-layout">
          <section className="cashier-menu">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="menu-category">
                <h2>{category}</h2>
                <div className="menu-grid">
                  {groupedMenu[category].map((item) => (
                    <button
                      key={`${item.productId}-${item.itemName}`}
                      className="menu-item"
                      type="button"
                      onClick={() => startCustomization(item)}
                    >
                      <span className="menu-item-name">{item.itemName}</span>
                      <span className="menu-item-price">${Number(item.effectivePrice).toFixed(2)}</span>
                      <span className="menu-item-note">Customize + Add</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <aside className="cart-panel">
            <h2>Cart</h2>
            {cartItems.length === 0 ? (
              <p className="cart-empty">No items yet.</p>
            ) : (
              <ul className="cart-list">
                {cartItems.map((item, index) => (
                  <li key={`${item.drinkName}-${item.size}-${item.optionsKey}-${index}`} className="cart-row">
                    <div className="cart-item-main">
                      <span>{item.drinkName}</span>
                      <span className="cart-meta">Size: {item.size}</span>
                      <span className="cart-meta">${item.unitPrice.toFixed(2)} each</span>
                    </div>
                    <div className="cart-actions">
                      <button type="button" onClick={() => decrementAt(index)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => incrementAt(index)}>
                        +
                      </button>
                      <button type="button" className="remove-btn" onClick={() => removeAt(index)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="cart-footer">
              <p>Total: ${cartTotal.toFixed(2)}</p>
              <button
                type="button"
                className="checkout-btn"
                disabled={cartItems.length === 0}
                onClick={() => {
                  setCheckoutError("");
                  setCheckoutOpen(true);
                }}
              >
                Continue to Checkout
              </button>
            </div>
          </aside>
        </main>
      )}

      {customizingItem && (
        <div className="modal-backdrop" onClick={closeCustomization}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{customizingItem.itemName}</h2>
            <p className="modal-subtitle">Customize your drink</p>

            <div className="modal-group" onClick={(e) => e.stopPropagation()}>
              <label>Size</label>
              <div className="chip-row">
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={customization.size === size ? "chip active" : "chip"}
                    onClick={() => toggleCustomizationField("size", size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-group" onClick={(e) => e.stopPropagation()}>
              <label>Sugar</label>
              <div className="chip-row">
                {["+Sugar", "-Sugar"].map((sugar) => (
                  <button
                    key={sugar}
                    type="button"
                    className={customization.sugar === sugar ? "chip active" : "chip"}
                    onClick={() => toggleCustomizationField("sugar", sugar)}
                  >
                    {sugar}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-group" onClick={(e) => e.stopPropagation()}>
              <label>Ice</label>
              <div className="chip-row">
                {["+Ice", "-Ice"].map((ice) => (
                  <button
                    key={ice}
                    type="button"
                    className={customization.ice === ice ? "chip active" : "chip"}
                    onClick={() => toggleCustomizationField("ice", ice)}
                  >
                    {ice}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-group" onClick={(e) => e.stopPropagation()}>
              <label>Toppings</label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={customization.noToppings}
                  onChange={(e) => toggleCustomizationField("noToppings", e.target.checked)}
                />
                No toppings
              </label>

              <div className="check-grid">
                {[
                  ["boba", "Boba (+$0.75)"],
                  ["jellies", "Jellies (+$0.75)"],
                  ["poppingBoba", "Popping Boba (+$0.75)"],
                  ["doubleBoba", "Double Boba (+$1.25)"],
                  ["extraMilk", "Extra Milk (+$0.50)"],
                  ["soyMilk", "Soy Milk (+$0.50)"],
                  ["blended", "Blended (+$0.50)"],
                ].map(([key, label]) => (
                  <label key={key} className="check-row">
                    <input
                      type="checkbox"
                      checked={customization[key]}
                      disabled={customization.noToppings}
                      onChange={(e) => toggleCustomizationField(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer" onClick={(e) => e.stopPropagation()}>
              <strong>${customizedUnitPrice.toFixed(2)}</strong>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeCustomization}>
                  Cancel
                </button>
                <button type="button" className="primary-btn" onClick={confirmCustomization}>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Order Confirmation</h2>
            <p className="modal-subtitle">Review cart and complete payment</p>

            <ul className="checkout-list">
              {cartItems.map((item, index) => (
                <li key={`${item.drinkName}-${item.size}-${item.optionsKey}-${index}`} className="checkout-row">
                  <div className="checkout-main">
                    <span>{item.drinkName}</span>
                    <span className="cart-meta">
                      {item.size} | ${item.unitPrice.toFixed(2)} each
                    </span>
                  </div>
                  <div className="cart-actions">
                    <button type="button" onClick={() => decrementAt(index)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => incrementAt(index)}>
                      +
                    </button>
                    <button type="button" className="remove-btn" onClick={() => removeAt(index)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="modal-group">
              <label htmlFor="customerIdField">Customer ID (blank = guest)</label>
              <input
                id="customerIdField"
                className="input"
                placeholder="e.g. 12"
                value={customerIdInput}
                onChange={(e) => setCustomerIdInput(e.target.value)}
              />
            </div>

            <div className="modal-group">
              <label>Payment Method</label>
              <div className="chip-row">
                {["CASH", "CARD"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={paymentType === value ? "chip active" : "chip"}
                    onClick={() => setPaymentType(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {checkoutError && <p className="cashier-error">{checkoutError}</p>}

            <div className="modal-footer">
              <strong>Total: ${cartTotal.toFixed(2)}</strong>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setCheckoutOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={cartItems.length === 0 || checkoutBusy}
                  onClick={submitCheckout}
                >
                  {checkoutBusy ? "Processing..." : "Checkout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentReceipt && (
        <div className="modal-backdrop" onClick={() => setPaymentReceipt(null)}>
          <div className="modal-card success" onClick={(e) => e.stopPropagation()}>
            <h2>Customer Payment</h2>
            <p className="success-check">✓</p>
            <p className="modal-subtitle">
              Transaction #{paymentReceipt.transactionId} | {paymentReceipt.paymentType}
            </p>
            <p className="modal-subtitle">
              Total ${Number(paymentReceipt.total || 0).toFixed(2)} for {paymentReceipt.numItems} item(s)
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => window.print()}>
                Print Receipt
              </button>
              <button type="button" className="primary-btn" onClick={() => setPaymentReceipt(null)}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={toast.type === "ok" ? "toast toast-ok" : "toast toast-bad"}>{toast.message}</div>}
    </div>
  );
}



