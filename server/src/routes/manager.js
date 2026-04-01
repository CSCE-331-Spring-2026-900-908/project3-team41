const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Creating inventory table
function makeInventoryDto(row) {
  return {
    inventoryId: Number(row.inventoryid),
    ingredientName: row.ingredientname,
    quantity: Number(row.quantity),
    price: Number(row.price),
  };
}

// Creating Employee table
function makeEmployeeDto(row) {
  return {
    employeeId: Number(row.employeeid),
    employeeName: row.employeename,
    isManager: row.ismanager,
    hoursWorked: Number(row.hoursworked),
    hourlyPay: Number(row.hourlypay),
  };
}

function normalizeMenuIngredients(value) {
  if (Array.isArray(value)) {
    return `{${value.map((entry) => String(entry).trim()).filter(Boolean).join(",")}}`;
  }

  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const entries = trimmed
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return `{${entries.join(",")}}`;
}

function makeMenuDto(row) {
  const rawIngredients = row.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients.map((entry) => String(entry).trim()).filter(Boolean).join(", ")
    : typeof rawIngredients === "string" && rawIngredients.startsWith("{") && rawIngredients.endsWith("}")
      ? rawIngredients.slice(1, -1).split(",").map((entry) => entry.trim()).filter(Boolean).join(", ")
      : rawIngredients;

  const price = Number(row.price);
  const discount = Number(row.discount || 0);

  return {
    productId: Number(row.productid),
    category: row.category,
    itemName: row.itemname,
    ingredients,
    price,
    discount,
    effectivePrice: Number((price - price * discount).toFixed(2)),
  };
}

// Getting all table information for inventory
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT inventoryid, ingredientname, quantity, price FROM inventory ORDER BY inventoryid ASC"
    );
    return res.json(result.rows.map(makeInventoryDto));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load inventory." });
  }
});

// Adding inventory item
router.post("/", async (req, res) => {
  const { ingredientName, quantity, price } = req.body;
  if (!ingredientName || typeof quantity !== "number" || typeof price !== "number") {
    return res.status(400).json({ error: "Invalid inventory payload." });
  }

  try {
    const nextIdResult = await pool.query(
      "SELECT COALESCE(MAX(inventoryid), 0) + 1 AS nextid FROM inventory"
    );
    const inventoryId = nextIdResult.rows[0].nextid;

    const insertResult = await pool.query(
      "INSERT INTO inventory (inventoryid, ingredientname, quantity, price) VALUES ($1, $2, $3, $4) RETURNING inventoryid, ingredientname, quantity, price",
      [inventoryId, ingredientName, quantity, price]
    );

    return res.status(201).json(makeInventoryDto(insertResult.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add inventory item." });
  }
});

// Removing inventory item
router.delete("/:inventoryId", async (req, res) => {
  const inventoryId = Number(req.params.inventoryId);
  if (!Number.isInteger(inventoryId)) {
    return res.status(400).json({ error: "Invalid inventory ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM inventory WHERE inventoryid = $1",
      [inventoryId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to remove inventory item." });
  }
});

// Restocking inventory
router.patch("/:inventoryId/restock", async (req, res) => {
  const inventoryId = Number(req.params.inventoryId);
  const { quantity } = req.body;

  if (!Number.isInteger(inventoryId) || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ error: "Invalid restock request." });
  }

  try {
    const result = await pool.query(
      "UPDATE inventory SET quantity = quantity + $1 WHERE inventoryid = $2 RETURNING inventoryid, ingredientname, quantity, price",
      [quantity, inventoryId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }
    return res.json(makeInventoryDto(result.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to restock inventory item." });
  }
});

// Update inventory item details
router.patch("/:inventoryId", async (req, res) => {
  const inventoryId = Number(req.params.inventoryId);
  const { ingredientName, quantity, price } = req.body;

  if (!Number.isInteger(inventoryId)) {
    return res.status(400).json({ error: "Invalid inventory ID." });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (typeof ingredientName === "string" && ingredientName.trim()) {
    updates.push(`ingredientname = $${idx++}`);
    values.push(ingredientName.trim());
  }
  if (typeof quantity === "number" && quantity >= 0) {
    updates.push(`quantity = $${idx++}`);
    values.push(quantity);
  }
  if (typeof price === "number" && price >= 0) {
    updates.push(`price = $${idx++}`);
    values.push(price);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update." });
  }

  values.push(inventoryId);

  try {
    const result = await pool.query(
      `UPDATE inventory SET ${updates.join(", ")} WHERE inventoryid = $${idx} RETURNING inventoryid, ingredientname, quantity, price`,
      values
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Inventory item not found." });
    }
    return res.json(makeInventoryDto(result.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update inventory item." });
  }
});

// Getting all table information for menu items
router.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT productid, category, itemname, ingredients, price, discount FROM menu ORDER BY productid ASC"
    );
    return res.json(result.rows.map(makeMenuDto));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load menu items." });
  }
});

// Add menu items
router.post("/menu", async (req, res) => {
  const { category, itemName, ingredients, price, discount } = req.body;
  if (
    !category ||
    !itemName ||
    !ingredients ||
    typeof price !== "number" ||
    typeof discount !== "number"
  ) {
    return res.status(400).json({ error: "Invalid menu payload." });
  }

  if (price < 0 || discount < 0 || discount > 1) {
    return res.status(400).json({ error: "Invalid menu payload." });
  }

  try {
    const nextIdResult = await pool.query(
      "SELECT COALESCE(MAX(productid), 0) + 1 AS nextid FROM menu"
    );
    const productId = nextIdResult.rows[0].nextid;

    const insertResult = await pool.query(
      "INSERT INTO menu (productid, category, itemname, ingredients, price, discount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING productid, category, itemname, ingredients, price, discount",
      [productId, category.trim(), itemName.trim(), normalizeMenuIngredients(ingredients), price, discount]
    );

    return res.status(201).json(makeMenuDto(insertResult.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add menu item." });
  }
});

// Edit menu items
router.patch("/menu/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  const { category, itemName, ingredients, price, discount } = req.body;

  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid menu ID." });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (typeof category === "string" && category.trim()) {
    updates.push(`category = $${idx++}`);
    values.push(category.trim());
  }
  if (typeof itemName === "string" && itemName.trim()) {
    updates.push(`itemname = $${idx++}`);
    values.push(itemName.trim());
  }
  if (typeof ingredients === "string" && ingredients.trim()) {
    updates.push(`ingredients = $${idx++}`);
    values.push(normalizeMenuIngredients(ingredients));
  }
  if (typeof price === "number" && price >= 0) {
    updates.push(`price = $${idx++}`);
    values.push(price);
  }
  if (typeof discount === "number" && discount >= 0 && discount <= 1) {
    updates.push(`discount = $${idx++}`);
    values.push(discount);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update." });
  }

  values.push(productId);

  try {
    const result = await pool.query(
      `UPDATE menu SET ${updates.join(", ")} WHERE productid = $${idx} RETURNING productid, category, itemname, ingredients, price, discount`,
      values
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }
    return res.json(makeMenuDto(result.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update menu item." });
  }
});

// Remove menu items
router.delete("/menu/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId)) {
    return res.status(400).json({ error: "Invalid menu ID." });
  }

  try {
    const result = await pool.query("DELETE FROM menu WHERE productid = $1", [productId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to remove menu item." });
  }
});

// Getting all table information for employees
router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT employeeid, employeename, ismanager, hoursworked, hourlypay FROM employee ORDER BY employeeid ASC"
    );
    return res.json(result.rows.map(makeEmployeeDto));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load employees." });
  }
});

// Add employees
router.post("/employees", async (req, res) => {
  const { employeeName, isManager, hoursWorked, hourlyPay } = req.body;
  if (!employeeName || typeof isManager !== "boolean" || typeof hoursWorked !== "number" || typeof hourlyPay !== "number") {
    return res.status(400).json({ error: "Invalid employee payload." });
  }

  try {
    const nextIdResult = await pool.query(
      "SELECT COALESCE(MAX(employeeid), 0) + 1 AS nextid FROM employee"
    );
    const employeeId = nextIdResult.rows[0].nextid;

    const insertResult = await pool.query(
      "INSERT INTO employee (employeeid, employeename, ismanager, hoursworked, hourlypay) VALUES ($1, $2, $3, $4, $5) RETURNING employeeid, employeename, ismanager, hoursworked, hourlypay",
      [employeeId, employeeName, isManager, hoursWorked, hourlyPay]
    );

    return res.status(201).json(makeEmployeeDto(insertResult.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add employee." });
  }
});

// Remove employees
router.delete("/employees/:employeeId", async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  if (!Number.isInteger(employeeId)) {
    return res.status(400).json({ error: "Invalid employee ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM employee WHERE employeeid = $1",
      [employeeId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to remove employee." });
  }
});

// Edit employee information
router.patch("/employees/:employeeId", async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const { employeeName, isManager, hoursWorked, hourlyPay } = req.body;
  if (!Number.isInteger(employeeId)) {
    return res.status(400).json({ error: "Invalid employee ID." });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (typeof employeeName === "string" && employeeName.trim()) {
    updates.push(`employeename = $${idx++}`);
    values.push(employeeName.trim());
  }
  if (typeof isManager === "boolean") {
    updates.push(`ismanager = $${idx++}`);
    values.push(isManager);
  }
  if (typeof hoursWorked === "number") {
    updates.push(`hoursworked = $${idx++}`);
    values.push(hoursWorked);
  }
  if (typeof hourlyPay === "number") {
    updates.push(`hourlypay = $${idx++}`);
    values.push(hourlyPay);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid fields to update." });
  }

  values.push(employeeId);

  try {
    const result = await pool.query(
      `UPDATE employee SET ${updates.join(", ")} WHERE employeeid = $${idx} RETURNING employeeid, employeename, ismanager, hoursworked, hourlypay`,
      values
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }
    return res.json(makeEmployeeDto(result.rows[0]));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update employee." });
  }
});

module.exports = router;


