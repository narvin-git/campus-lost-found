const fs = require("fs");
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // TLS only when DB_SSL=true (TiDB Cloud requires it; local MySQL does not).
  // DB_SSL_CA is optional: without it Node's built-in CA store is used.
  ssl:
    process.env.DB_SSL === "true"
      ? {
          ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
          minVersion: "TLSv1.2",
          rejectUnauthorized: true
        }
      : false,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
