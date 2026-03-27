const { Pool } = require("pg");

const pool = new Pool({
  host: "csce-315-db.engr.tamu.edu",
  port: 5432,
  database: "team_41_db",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

module.exports = pool;