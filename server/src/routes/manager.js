const express = require("express");
const router = express.Router();
const pool = require("../config/db");

function makeInventoryDto(row) {
  return {
    inventoryId: Number(row.inventoryid),
    ingredientName: row.ingredientname,
    quantity: Number(row.quantity),
    price: Number(row.price),
  };
}

function makeEmployeeDto(row) {
  return {
    employeeId: Number(row.employeeid),
    employeeName: row.employeename,
    isManager: row.ismanager,
    hoursWorked: Number(row.hoursworked),
    hourlyPay: Number(row.hourlypay),
  };
}

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


