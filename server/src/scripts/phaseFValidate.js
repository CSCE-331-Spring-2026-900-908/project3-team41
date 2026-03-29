async function run() {
  const base = "http://localhost:3001/api/cashier";
  const results = [];

  const menuRes = await fetch(`${base}/menu`);
  const menuBody = await menuRes.json();
  results.push({
    test: "GET /menu",
    status: menuRes.status,
    ok: menuRes.ok && menuBody.success === true && Array.isArray(menuBody.items),
    detail: `count=${Array.isArray(menuBody.items) ? menuBody.items.length : 0}`,
  });

  const invalidRes = await fetch(`${base}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: 1, paymentType: "CASH", items: [] }),
  });
  const invalidBody = await invalidRes.json();
  results.push({
    test: "POST /checkout invalid payload",
    status: invalidRes.status,
    ok: invalidRes.status === 400 && Array.isArray(invalidBody.errors),
    detail: (invalidBody.errors || []).join(" | "),
  });

  const unknownRes = await fetch(`${base}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: 1,
      customerId: 1,
      paymentType: "CASH",
      items: [
        {
          drinkName: "NOT_A_REAL_DRINK",
          size: "S",
          optionsKey: "size=S;",
          quantity: 1,
          unitPrice: 1,
        },
      ],
    }),
  });
  const unknownBody = await unknownRes.json();
  results.push({
    test: "POST /checkout unknown item",
    status: unknownRes.status,
    ok: unknownRes.status === 400,
    detail: unknownBody.error || "",
  });

  const menuItems = Array.isArray(menuBody.items) ? menuBody.items : [];
  let successfulCheckout = null;
  let inventoryConflict = null;

  for (const item of menuItems) {
    const payload = {
      employeeId: 1,
      customerId: 1,
      paymentType: "CASH",
      items: [
        {
          drinkName: item.itemName,
          size: "S",
          optionsKey: "size=S;sugar=+Sugar;ice=+Ice;",
          quantity: 1,
          unitPrice: item.effectivePrice,
        },
      ],
    };

    const res = await fetch(`${base}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (res.status === 409 && !inventoryConflict) {
      inventoryConflict = body.error || "Inventory conflict";
    }

    if (res.ok && body.success) {
      successfulCheckout = {
        itemName: item.itemName,
        transactionId: body.transactionId,
        total: body.total,
      };
      break;
    }
  }

  results.push({
    test: "POST /checkout success path",
    status: successfulCheckout ? 200 : 409,
    ok: Boolean(successfulCheckout),
    detail: successfulCheckout
      ? `item=${successfulCheckout.itemName}, transactionId=${successfulCheckout.transactionId}, total=${successfulCheckout.total}`
      : "No in-stock item found for quantity=1",
  });

  results.push({
    test: "POST /checkout inventory conflict path",
    status: inventoryConflict ? 409 : 200,
    ok: Boolean(inventoryConflict),
    detail: inventoryConflict || "No conflict observed during probe",
  });

  for (const row of results) {
    console.log(
      `${row.ok ? "PASS" : "FAIL"} | ${row.test} | status=${row.status} | ${row.detail}`
    );
  }

  const failed = results.filter((row) => !row.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Validation runner failed:", err);
  process.exit(1);
});
