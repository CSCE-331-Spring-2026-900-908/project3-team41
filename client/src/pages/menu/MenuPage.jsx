import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/CashierPage.css";
import "../../styles/MenuPage.css";

import almondMilkTeaImg from "./menupics/almondmilktea.jpg";
import blueberryFruitTeaImg from "./menupics/blueberryfruitttea.jpg";
import brownSugarMatchaLatteImg from "./menupics/brownsugarmatchalatte.jpg";
import brownSugarTeaImg from "./menupics/brownsugartea.jpg";
import chocolateMilkTeaImg from "./menupics/chocolatemilktea.jpg";
import classicMilkTeaImg from "./menupics/classicmilktea.png";
import coconutMilkTeaImg from "./menupics/coconutmilktea.png";
import coffeeMilkTeaImg from "./menupics/coffeemilktea.png";
import hokkaidoMilkTeaImg from "./menupics/hokkaidomilktea.jpg";
import honeydewMilkTeaImg from "./menupics/honeydewmilktea.png";
import jasmineGreenMilkTeaImg from "./menupics/jasminegreenmilktea.png";
import lycheeBlackTeaImg from "./menupics/lycheeblacktea.jpg";
import mangoGreenTeaImg from "./menupics/mangogreentea.jpg";
import matchaMilkTeaImg from "./menupics/matchamilktea.png";
import matchaRedBeanLatteImg from "./menupics/matcharedbeanlatte.png";
import passionFruitTeaImg from "./menupics/passionfruittea.png";
import peachOolongTeaImg from "./menupics/peachoolongtea.jpg";
import pineappleFruitTeaImg from "./menupics/pineapplefruittea.jpg";
import saltedCreamCheeseTeaImg from "./menupics/saltedcreamcheesetea.jpg";
import strawberryMatchaFusionImg from "./menupics/strawberrymatchafusion.jpg";
import strawberryMilkTeaImg from "./menupics/strawberrymilktea.jpg";
import taroMilkTeaImg from "./menupics/taromilktea.jpg";
import thaiMilkTeaImg from "./menupics/thaimilktea.jpg";
import wintermelonTeaImg from "./menupics/wintermelontea.jpg";




const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

const CATEGORY_ORDER = ["Classics", "Fruity", "Creamy", "Savory", "Specialties"];

function categoryLabel(rawCategory) {
  const value = (rawCategory || "").toLowerCase();
  if (value.includes("classic")) return "Classics";
  if (value.includes("fruit")) return "Fruity";
  if (value.includes("cream")) return "Creamy";
  if (value.includes("savory")) return "Savory";
  return "Specialties";
}

const MENU_DETAILS = {
  "Classic Milk Tea": {
    image: classicMilkTeaImg,
    description: "A smooth and classic black tea blended with creamy milk for a rich and refreshing drink."
  },
  "Taro Milk Tea": {
    image: taroMilkTeaImg,
    description: "A creamy milk tea with sweet taro flavor and a smooth, nutty finish."
  },
  "Matcha Milk Tea": {
    image: matchaMilkTeaImg,
    description: "A creamy milk tea blended with earthy matcha for a smooth and energizing drink."
  },
  "Thai Milk Tea": {
    image: thaiMilkTeaImg,
    description: "A bold and creamy Thai tea with a sweet flavor and signature spiced aroma."
  },

  "Mango Green Tea": {
    image: mangoGreenTeaImg,
    description: "A refreshing green tea infused with juicy mango for a bright tropical flavor."
  },
  "Passion Fruit Tea": {
    image: passionFruitTeaImg,
    description: "A fruity tea with tangy passion fruit flavor and a crisp refreshing finish."
  },
  "Lychee Black Tea": {
    image: lycheeBlackTeaImg,
    description: "A fragrant black tea infused with sweet lychee for a light and floral fruit taste."
  },
  "Peach Oolong Tea": {
    image: peachOolongTeaImg,
    description: "A smooth oolong tea blended with peach for a sweet and refreshing flavor."
  },
  "Wintermelon Tea": {
    image: wintermelonTeaImg,
    description: "A mellow and refreshing tea with sweet wintermelon flavor and a light caramel note."
  },
  "Pineapple Fruit Tea": {
    image: pineappleFruitTeaImg,
    description: "A tropical fruit tea bursting with juicy pineapple flavor and a refreshing finish."
  },
  "Blueberry Fruit Tea": {
    image: blueberryFruitTeaImg,
    description: "A fruity tea with sweet blueberry flavor and a slightly tart refreshing taste."
  },

  "Brown Sugar Boba": {
    image: brownSugarTeaImg,
    description: "A rich and creamy drink sweetened with brown sugar and served with chewy boba pearls."
  },
  "Honeydew Milk Tea": {
    image: honeydewMilkTeaImg,
    description: "A creamy milk tea blended with sweet honeydew melon for a smooth refreshing drink."
  },
  "Strawberry Milk Tea": {
    image: strawberryMilkTeaImg,
    description: "A creamy milk tea with sweet strawberry flavor and a refreshing fruity finish."
  },
  "Coffee Milk Tea": {
    image: coffeeMilkTeaImg,
    description: "A bold and creamy drink that combines milk tea with rich coffee flavor."
  },

  "Almond Milk Tea": {
    image: almondMilkTeaImg,
    description: "A creamy milk tea with a sweet almond flavor and a smooth nutty finish."
  },
  "Chocolate Milk Tea": {
    image: chocolateMilkTeaImg,
    description: "A rich and creamy milk tea blended with chocolate for a sweet indulgent treat."
  },
  "Coconut Milk Tea": {
    image: coconutMilkTeaImg,
    description: "A smooth milk tea infused with coconut flavor for a sweet tropical twist."
  },
  "Jasmine Green Milk Tea": {
    image: jasmineGreenMilkTeaImg,
    description: "A fragrant jasmine green tea blended with creamy milk for a floral refreshing drink."
  },

  "Matcha Red Bean Latte": {
    image: matchaRedBeanLatteImg,
    description: "A creamy matcha latte paired with sweet red bean for a rich earthy and comforting flavor."
  },
  "Hokkaido Milk Tea": {
    image: hokkaidoMilkTeaImg,
    description: "A rich and creamy milk tea with deep caramel-like sweetness inspired by Hokkaido style."
  },
  "Salted Cream Cheese Tea": {
    image: saltedCreamCheeseTeaImg,
    description: "A refreshing tea topped with a savory salted cream cheese foam for a sweet and salty balance."
  },
  "Brown Sugar Matcha Latte": {
    image: brownSugarMatchaLatteImg,
    description: "A smooth matcha latte sweetened with brown sugar for a rich earthy and caramel-like flavor."
  },
  "Strawberry Matcha Fusion": {
    image: strawberryMatchaFusionImg,
    description: "A layered drink that combines sweet strawberry with earthy matcha for a bold refreshing fusion."
  }
};

const DEFAULT_ITEM_DETAILS = {
  image: classicMilkTeaImg,
  description: "A delicious handcrafted menu item made fresh for our customers."
};

export default function MenuPage() {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

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
    function handleEsc(event) {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

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

  function goHome() {
    navigate("/");
  }

  function openItemPopup(item) {
    const details = MENU_DETAILS[item.itemName] || DEFAULT_ITEM_DETAILS;
    setSelectedItem({
      ...item,
      image: details.image,
      description: details.description
    });
  }

  function closeItemPopup() {
    setSelectedItem(null);
  }

  return (
    <div className="cashier-root">
      <header className="cashier-header">
        <div>
          <h1 className="cashier-title">Menu</h1>
          <p className="cashier-subtitle">Browse our drinks</p>
        </div>
        <button className="cashier-logout" onClick={goHome} type="button">
          Back
        </button>
      </header>

      {loading && <p className="cashier-status">Loading menu...</p>}
      {!loading && error && <p className="cashier-error">{error}</p>}

      {!loading && !error && (
        <main className="menu-main">
          <section className="cashier-menu menu-page-wrapper">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="menu-category">
                <h2>{category}</h2>
                <div className="menu-grid">
                  {groupedMenu[category].map((item) => (
                    <button
                      key={`${item.productId}-${item.itemName}`}
                      className="menu-item menu-item-button"
                      type="button"
                      onClick={() => openItemPopup(item)}
                    >
                      <span className="menu-item-name">{item.itemName}</span>
                      <span className="menu-item-price">
                        ${Number(item.effectivePrice).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      )}

      {selectedItem && (
        <div className="menu-modal-overlay" onClick={closeItemPopup}>
          <div className="menu-modal" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedItem.image}
              alt={selectedItem.itemName}
              className="menu-modal-image"
              onError={(e) => {
                e.target.src = DEFAULT_ITEM_DETAILS.image;
              }}
            />

            <div className="menu-modal-body">
              <h2 className="menu-modal-title">{selectedItem.itemName}</h2>

              <p className="menu-modal-price">
                ${Number(selectedItem.effectivePrice).toFixed(2)}
              </p>

              <p className="menu-modal-description">
                {selectedItem.description}
              </p>

              <button
                type="button"
                className="menu-modal-close"
                onClick={closeItemPopup}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}