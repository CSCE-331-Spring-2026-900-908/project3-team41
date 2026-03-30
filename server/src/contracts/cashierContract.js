/**
 * Cashier API contract definitions and lightweight validation helpers.
 * Phase A goal: lock payload/response shape before route implementation.
 */

const PAYMENT_TYPES = Object.freeze({
  CASH: "CASH",
  CARD: "CARD",
});

/**
 * @typedef {Object} CashierMenuItemDto
 * @property {number} productId
 * @property {string} itemName
 * @property {string} category
 * @property {number} price
 * @property {number} discount
 * @property {number} effectivePrice
 */

/**
 * @typedef {Object} CheckoutItemDto
 * @property {string} drinkName
 * @property {string} size
 * @property {string} optionsKey
 * @property {number} quantity
 * @property {number} unitPrice
 */

/**
 * @typedef {Object} CheckoutRequestDto
 * @property {number} employeeId
 * @property {number} customerId
 * @property {"CASH"|"CARD"} paymentType
 * @property {CheckoutItemDto[]} items
 */

/**
 * @typedef {Object} CheckoutResponseDto
 * @property {boolean} success
 * @property {number} transactionId
 * @property {number} total
 * @property {number} numItems
 * @property {string} paymentType
 * @property {string} [message]
 */

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Validate one line item so API errors can point to exact array indices.
function validateCheckoutItem(item, index) {
  const errors = [];
  const prefix = `items[${index}]`;

  if (!item || typeof item !== "object") {
    return [`${prefix} must be an object`];
  }

  if (!isNonEmptyString(item.drinkName)) {
    errors.push(`${prefix}.drinkName must be a non-empty string`);
  }

  if (!isNonEmptyString(item.size)) {
    errors.push(`${prefix}.size must be a non-empty string`);
  }

  if (typeof item.optionsKey !== "string") {
    errors.push(`${prefix}.optionsKey must be a string`);
  }

  if (!isPositiveInt(item.quantity)) {
    errors.push(`${prefix}.quantity must be a positive integer`);
  }

  if (!isNonNegativeNumber(item.unitPrice)) {
    errors.push(`${prefix}.unitPrice must be a non-negative number`);
  }

  return errors;
}

// Validate the full checkout payload against the agreed contract.
function validateCheckoutRequest(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return { isValid: false, errors: ["payload must be an object"] };
  }

  if (!isPositiveInt(payload.employeeId)) {
    errors.push("employeeId must be a positive integer");
  }

  if (!isPositiveInt(payload.customerId)) {
    errors.push("customerId must be a positive integer");
  }

  if (!Object.values(PAYMENT_TYPES).includes(payload.paymentType)) {
    errors.push('paymentType must be "CASH" or "CARD"');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push("items must be a non-empty array");
  } else {
    payload.items.forEach((item, index) => {
      errors.push(...validateCheckoutItem(item, index));
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Shared server-side totaling to keep route logic and responses consistent.
function computeCheckoutTotals(items) {
  const totals = items.reduce(
    (acc, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      acc.total += lineTotal;
      acc.numItems += item.quantity;
      return acc;
    },
    { total: 0, numItems: 0 }
  );

  return {
    total: Number(totals.total.toFixed(2)),
    numItems: totals.numItems,
  };
}

module.exports = {
  PAYMENT_TYPES,
  validateCheckoutRequest,
  computeCheckoutTotals,
};
