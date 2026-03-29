# Cashier API Contract (Phase A)

This document locks the request/response shapes for the cashier migration slice.

## Endpoints

### `GET /api/cashier/menu`

Returns menu items formatted for the cashier UI.

Response body:

```json
{
  "success": true,
  "items": [
    {
      "productId": 42,
      "itemName": "Thai Milk Tea",
      "category": "Classics",
      "price": 5.25,
      "discount": 0.1,
      "effectivePrice": 4.73
    }
  ]
}
```

### `POST /api/cashier/checkout`

Submits a cart and processes checkout.

Request body:

```json
{
  "employeeId": 3,
  "customerId": 1,
  "paymentType": "CASH",
  "items": [
    {
      "drinkName": "Thai Milk Tea",
      "size": "L",
      "optionsKey": "size=L;sugar=+Sugar;ice=-Ice;boba=true;",
      "quantity": 2,
      "unitPrice": 6.5
    }
  ]
}
```

Success response body:

```json
{
  "success": true,
  "transactionId": 1001,
  "total": 13,
  "numItems": 2,
  "paymentType": "CASH",
  "message": "Checkout completed"
}
```

Validation/error response body:

```json
{
  "success": false,
  "errors": [
    "employeeId must be a positive integer",
    "items must be a non-empty array"
  ]
}
```

## Rules

- `paymentType` must be `"CASH"` or `"CARD"`.
- `employeeId` and `customerId` must be positive integers.
- `items` must be a non-empty array.
- Each item requires: `drinkName`, `size`, `optionsKey`, `quantity`, `unitPrice`.
- `quantity` must be a positive integer.
- `unitPrice` must be a non-negative finite number.

## Source of truth

Validation helpers for this contract live in:

- `server/src/contracts/cashierContract.js`
