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

function toNumeric(value) {
  return Number(value || 0);
}

function toMoney(value) {
  return Number(toNumeric(value).toFixed(2));
}

function normalizeDateRange(from, to) {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayString = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const start = typeof from === "string" && from.trim() ? from.trim() : todayString;
  const end = typeof to === "string" && to.trim() ? to.trim() : todayString;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { error: "Date range must use YYYY-MM-DD format." };
  }

  if (start > end) {
    return { error: "Start date must be before or equal to end date." };
  }

  return { start, end };
}

async function fetchRangeAnalytics(startDate, endDate) {
  const productUsageResult = await pool.query(
    `WITH sold_products AS (
       SELECT unnest(productids) AS productid
       FROM order_history
       WHERE date BETWEEN $1::date AND $2::date
     )
     SELECT
       ingredient AS "ingredientName",
       COUNT(*)::int AS usage
     FROM sold_products sp
     JOIN menu m ON m.productid = sp.productid
     CROSS JOIN LATERAL unnest(m.ingredients::text[]) AS ingredient
     GROUP BY ingredient
     ORDER BY usage DESC, ingredient ASC`,
    [startDate, endDate]
  );

  const salesByItemResult = await pool.query(
    `WITH sold_products AS (
       SELECT unnest(productids) AS productid
       FROM order_history
       WHERE date BETWEEN $1::date AND $2::date
     )
     SELECT
       m.productid AS "productId",
       m.itemname AS "itemName",
       COUNT(*)::int AS "itemsSold",
       ROUND(SUM((m.price * (1 - COALESCE(m.discount, 0)))::numeric), 2) AS revenue
     FROM sold_products sp
     JOIN menu m ON m.productid = sp.productid
     GROUP BY m.productid, m.itemname
     ORDER BY revenue DESC, m.itemname ASC`,
    [startDate, endDate]
  );

  const categoryRevenueResult = await pool.query(
    `WITH sold_products AS (
       SELECT unnest(productids) AS productid
       FROM order_history
       WHERE date BETWEEN $1::date AND $2::date
     )
     SELECT
       m.category,
       ROUND(SUM((m.price * (1 - COALESCE(m.discount, 0)))::numeric), 2) AS revenue,
       COUNT(*)::int AS sold
     FROM sold_products sp
     JOIN menu m ON m.productid = sp.productid
     GROUP BY m.category
     ORDER BY revenue DESC, m.category ASC`,
    [startDate, endDate]
  );

  return {
    productUsage: productUsageResult.rows.map((row) => ({
      ingredientName: row.ingredientName,
      usage: Number(row.usage),
    })),
    salesByItem: salesByItemResult.rows.map((row) => ({
      productId: Number(row.productId),
      itemName: row.itemName,
      itemsSold: Number(row.itemsSold),
      revenue: toMoney(row.revenue),
    })),
    revenueByCategory: categoryRevenueResult.rows.map((row) => ({
      category: row.category,
      revenue: toMoney(row.revenue),
      sold: Number(row.sold),
    })),
  };
}

async function fetchReportTotalsByDate(targetDate) {
  const totalsResult = await pool.query(
    `SELECT
       COUNT(*)::int AS transactions,
       COALESCE(SUM(numitems), 0)::int AS "itemsCount",
       COALESCE(ROUND(SUM(price)::numeric, 2), 0) AS "salesTotal",
       COALESCE(ROUND(AVG(price)::numeric, 2), 0) AS "averagePrice",
       COALESCE(ROUND(SUM(CASE WHEN UPPER(payment_type) = 'CASH' THEN price ELSE 0 END)::numeric, 2), 0) AS cash,
       COALESCE(ROUND(SUM(CASE WHEN UPPER(payment_type) = 'CARD' THEN price ELSE 0 END)::numeric, 2), 0) AS card
     FROM order_history
     WHERE date = $1::date`,
    [targetDate]
  );

  const row = totalsResult.rows[0] || {};
  return {
    transactions: Number(row.transactions || 0),
    itemsCount: Number(row.itemsCount || 0),
    salesTotal: toMoney(row.salesTotal),
    averagePrice: toMoney(row.averagePrice),
    cash: toMoney(row.cash),
    card: toMoney(row.card),
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

// Analytics overview for a date range
router.get("/analytics/overview", async (req, res) => {
  const { from, to } = req.query;
  const range = normalizeDateRange(from, to);
  if (range.error) {
    return res.status(400).json({ error: range.error });
  }

  try {
    const data = await fetchRangeAnalytics(range.start, range.end);
    return res.json({
      from: range.start,
      to: range.end,
      ...data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load analytics data." });
  }
});

// X report: current-day sales activity by hour with no side effects
router.get("/reports/x", async (_req, res) => {
  try {
    const dateResult = await pool.query("SELECT CURRENT_DATE::text AS today");
    const businessDate = dateResult.rows[0].today;

    const hourlyResult = await pool.query(
      `SELECT
         EXTRACT(HOUR FROM time)::int AS hour,
         COUNT(*)::int AS transactions,
         COALESCE(SUM(numitems), 0)::int AS "itemsCount",
         COALESCE(ROUND(SUM(price)::numeric, 2), 0) AS "salesTotal",
         COALESCE(ROUND(AVG(price)::numeric, 2), 0) AS "averagePrice",
         COALESCE(ROUND(SUM(CASE WHEN UPPER(payment_type) = 'CASH' THEN price ELSE 0 END)::numeric, 2), 0) AS cash,
         COALESCE(ROUND(SUM(CASE WHEN UPPER(payment_type) = 'CARD' THEN price ELSE 0 END)::numeric, 2), 0) AS card
       FROM order_history
       WHERE date = $1::date
       GROUP BY hour
       ORDER BY hour ASC`,
      [businessDate]
    );

    const totals = await fetchReportTotalsByDate(businessDate);

    return res.json({
      reportType: "X",
      businessDate,
      totals,
      hourly: hourlyResult.rows.map((row) => ({
        hour: Number(row.hour),
        transactions: Number(row.transactions),
        itemsCount: Number(row.itemsCount),
        salesTotal: toMoney(row.salesTotal),
        averagePrice: toMoney(row.averagePrice),
        cash: toMoney(row.cash),
        card: toMoney(row.card),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate X report." });
  }
});

// Z report: end-of-day totals with one-run-per-day side effect
router.post("/reports/z", async (_req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `CREATE TABLE IF NOT EXISTS z_report_audit (
         business_date DATE PRIMARY KEY,
         generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
         transactions INT NOT NULL,
         itemscount INT NOT NULL,
         salestotal NUMERIC(12,2) NOT NULL,
         averageprice NUMERIC(12,2) NOT NULL,
         cash NUMERIC(12,2) NOT NULL,
         card NUMERIC(12,2) NOT NULL
       )`
    );

    const dateResult = await client.query("SELECT CURRENT_DATE::text AS today");
    const businessDate = dateResult.rows[0].today;

    const existing = await client.query(
      "SELECT business_date, generated_at FROM z_report_audit WHERE business_date = $1::date",
      [businessDate]
    );

    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Z report has already been run for today.",
        businessDate,
        generatedAt: existing.rows[0].generated_at,
      });
    }

    const totalsResult = await client.query(
      `SELECT
         COUNT(*)::int AS transactions,
         COALESCE(SUM(numitems), 0)::int AS itemscount,
         COALESCE(ROUND(SUM(price)::numeric, 2), 0) AS salestotal,
         COALESCE(ROUND(AVG(price)::numeric, 2), 0) AS averageprice,
         COALESCE(ROUND(SUM(CASE WHEN UPPER(payment_type) = 'CASH' THEN price ELSE 0 END)::numeric, 2), 0) AS cash,
         COALESCE(ROUND(SUM(CASE WHEN UPPER(payment_type) = 'CARD' THEN price ELSE 0 END)::numeric, 2), 0) AS card
       FROM order_history
       WHERE date = $1::date`,
      [businessDate]
    );

    const totals = totalsResult.rows[0];

    const insert = await client.query(
      `INSERT INTO z_report_audit (
         business_date,
         transactions,
         itemscount,
         salestotal,
         averageprice,
         cash,
         card
       ) VALUES ($1::date, $2, $3, $4, $5, $6, $7)
       RETURNING business_date, generated_at, transactions, itemscount, salestotal, averageprice, cash, card`,
      [
        businessDate,
        Number(totals.transactions || 0),
        Number(totals.itemscount || 0),
        toMoney(totals.salestotal),
        toMoney(totals.averageprice),
        toMoney(totals.cash),
        toMoney(totals.card),
      ]
    );

    await client.query("COMMIT");

    const row = insert.rows[0];
    return res.json({
      reportType: "Z",
      businessDate: row.business_date,
      generatedAt: row.generated_at,
      totals: {
        transactions: Number(row.transactions),
        itemsCount: Number(row.itemscount),
        salesTotal: toMoney(row.salestotal),
        averagePrice: toMoney(row.averageprice),
        cash: toMoney(row.cash),
        card: toMoney(row.card),
      },
      sideEffect: "Day totals are now closed for this business date.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Failed to generate Z report." });
  } finally {
    client.release();
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


