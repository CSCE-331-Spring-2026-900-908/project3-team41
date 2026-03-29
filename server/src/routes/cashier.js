const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const {
  validateCheckoutRequest,
  computeCheckoutTotals,
} = require("../contracts/cashierContract");

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

router.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        productid,
        itemname,
        category,
        price,
        discount
      FROM menu
      ORDER BY productid ASC`
    );

    const items = result.rows.map((row) => {
      const price = Number(row.price);
      const discount = Number(row.discount || 0);
      const effectivePrice = Number((price - price * discount).toFixed(2));

      return {
        productId: row.productid,
        itemName: row.itemname,
        category: row.category,
        price,
        discount,
        effectivePrice,
      };
    });

    return res.json({
      success: true,
      items,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Database error while loading menu",
    });
  }
});

router.post("/checkout", async (req, res) => {
  const payload = req.body;
  const validation = validateCheckoutRequest(payload);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors,
    });
  }

  const { employeeId, customerId, paymentType, items } = payload;
  const { total, numItems } = computeCheckoutTotals(items);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productIdsExpanded = [];

    for (const item of items) {
      const productResult = await client.query(
        "SELECT productid FROM menu WHERE itemname = $1 LIMIT 1",
        [item.drinkName]
      );

      if (productResult.rows.length === 0) {
        throw httpError(400, `Unknown menu item: ${item.drinkName}`);
      }

      const productId = productResult.rows[0].productid;
      for (let i = 0; i < item.quantity; i += 1) {
        productIdsExpanded.push(productId);
      }
    }

    const transactionResult = await client.query(
      `INSERT INTO order_history (time, date, price, numItems, employeeID, customerID, productIDs, payment_type)
       VALUES (NOW()::time, NOW()::date, $1, $2, $3, $4, $5, $6)
       RETURNING transactionID`,
      [total, numItems, employeeId, customerId, productIdsExpanded, paymentType]
    );

    const transactionId = transactionResult.rows[0].transactionid;

    for (const item of items) {
      const ingredientResult = await client.query(
        "SELECT ingredients::text[] FROM menu WHERE LOWER(itemname) = LOWER($1) LIMIT 1",
        [item.drinkName]
      );

      if (ingredientResult.rows.length === 0) {
        throw httpError(400, `No menu entry found for: ${item.drinkName}`);
      }

      const ingredients = ingredientResult.rows[0].ingredients || [];
      let cupInventoryName = "32oz plastic cups";

      if (item.size === "S") cupInventoryName = "8oz plastic cups";
      else if (item.size === "M") cupInventoryName = "16oz plastic cups";
      else if (item.size === "L") cupInventoryName = "24oz plastic cups";

      for (const ingredient of ingredients) {
        const ingredientUpdate = await client.query(
          "UPDATE inventory SET quantity = quantity - $1 WHERE ingredientname = $2 AND quantity >= $1",
          [item.quantity, ingredient]
        );
        if (ingredientUpdate.rowCount === 0) {
          throw httpError(409, `Insufficient inventory for ingredient: ${ingredient}`);
        }
      }

      const cupUpdate = await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE ingredientname = $2 AND quantity >= $1",
        [item.quantity, cupInventoryName]
      );
      if (cupUpdate.rowCount === 0) {
        throw httpError(409, `Insufficient inventory for: ${cupInventoryName}`);
      }

      const suppliesUpdate = await client.query(
        "UPDATE inventory SET quantity = quantity - $1 WHERE ingredientname IN ('boba straws', 'sealing film rolls', 'stirrers') AND quantity >= $1",
        [item.quantity]
      );
      if (suppliesUpdate.rowCount < 3) {
        throw httpError(409, "Insufficient inventory for consumable supplies");
      }
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      transactionId,
      total,
      numItems,
      paymentType,
      message: "Checkout completed",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || "Checkout failed",
    });
  } finally {
    client.release();
  }
});

module.exports = router;
