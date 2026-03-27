const express = require("express");
const router = express.Router();
const pool = require("../db");

// Employee login
router.post("/employee", async (req, res) => {
  const { employeeId } = req.body;

  if (!Number.isInteger(employeeId)) {
    return res.status(400).json({ error: "Please enter a numeric Employee ID." });
  }

  try {
    const result = await pool.query(
      "SELECT employeeid, employeename FROM employee WHERE employeeid = $1",
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid ID" });
    }

    const employee = result.rows[0];

    return res.json({
      success: true,
      name: employee.employeename,
      message: `Successful login: Welcome, ${employee.employeename}!`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error occurred." });
  }
});

// Manager login
router.post("/manager", async (req, res) => {
  const { employeeId, password } = req.body;

  if (!Number.isInteger(employeeId)) {
    return res.status(400).json({ error: "Please enter a numeric Manager ID." });
  }

  try {
    const result = await pool.query(
      `
      SELECT employeeid, employeename, ismanager, password
      FROM employee
      WHERE employeeid = $1
      `,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid employee ID or not a manager." });
    }

    const user = result.rows[0];

    if (!user.ismanager) {
      return res.status(401).json({ error: "Invalid employee ID or not a manager." });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password." });
    }

    return res.json({
      success: true,
      name: user.employeename,
      message: `Successful login: Welcome, ${user.employeename}!`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error occurred." });
  }
});

module.exports = router;