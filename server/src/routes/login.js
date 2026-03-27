const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      success: true,
      message: "Database connection works",
      time: result.rows[0].current_time,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
    });
  }
});

router.post("/employee", async (req, res) => {
  const { employeeId } = req.body;

  try {
    const result = await pool.query(
      "SELECT employeeid, employeename FROM employee WHERE employeeid = $1",
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid ID",
      });
    }

    return res.json({
      success: true,
      name: result.rows[0].employeename,
      message: `Successful login: Welcome, ${result.rows[0].employeename}!`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Database error",
    });
  }
});

router.post("/manager", async (req, res) => {
  const { employeeId, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT employeeid, employeename, ismanager FROM employee WHERE employeeid = $1",
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid manager ID",
      });
    }

    const user = result.rows[0];

    if (!user.ismanager) {
      return res.status(403).json({
        success: false,
        error: "This employee is not a manager",
      });
    }

    if (password !== "managerpass") {
      return res.status(401).json({
        success: false,
        error: "Incorrect manager password",
      });
    }

    return res.json({
      success: true,
      name: user.employeename,
      message: `Manager login successful: Welcome, ${user.employeename}!`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Database error",
    });
  }
});

module.exports = router;