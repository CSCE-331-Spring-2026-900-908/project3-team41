require("dotenv").config();
const { Pool } = require("pg");

const dbSslEnabled =
  String(process.env.DB_SSL || process.env.DB_REQUIRE_SSL || "").toLowerCase() === "true";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Some Postgres hosts don't support SSL. Make it opt-in via DB_SSL=true.
  ...(dbSslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
});

module.exports = pool;