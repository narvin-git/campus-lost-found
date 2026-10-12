const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Writes to the project root (campus-lost-found/backup.sql)
const BACKUP_FILE = path.join(__dirname, "../../../backup.sql");
const TMP_FILE = `${BACKUP_FILE}.tmp`;

// Opt-in only: production (Render) has no mysqldump and an ephemeral disk
const enabled = process.env.AUTO_BACKUP === "true";

let running = false;
let pendingReason = null;

function runBackup(reason) {
  running = true;
  const started = Date.now();

  const args = [
    `--host=${process.env.DB_HOST || "localhost"}`,
    `--port=${process.env.DB_PORT || 3306}`,
    `--user=${process.env.DB_USER}`,
    "--single-transaction", // consistent snapshot without LOCK TABLES privilege
    "--no-tablespaces", // avoids needing the PROCESS privilege
    "--column-statistics=0", // MySQL 8 client vs TiDB/older servers
    `--result-file=${TMP_FILE}`,
    process.env.DB_NAME,
    "items",
  ];
  if (process.env.DB_SSL === "true") args.push("--ssl-mode=REQUIRED");

  execFile(
    process.env.MYSQLDUMP_PATH || "mysqldump",
    args,
    // Password via env, not argv, so it never appears in the process list
    { env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || "" }, windowsHide: true },
    (err, stdout, stderr) => {
      try {
        if (err) throw new Error(stderr.trim() || err.message);
        // Atomic replace so a failed dump never leaves a half-written backup.sql
        fs.renameSync(TMP_FILE, BACKUP_FILE);
        const { size } = fs.statSync(BACKUP_FILE);
        console.log(
          `[backup] ${new Date().toISOString()} ${reason} -> backup.sql (${size} bytes, ${Date.now() - started} ms)`
        );
      } catch (e) {
        console.error(`[backup] ${new Date().toISOString()} ${reason} FAILED: ${e.message}`);
      }

      running = false;
      // Coalesce changes made while a dump was running into one follow-up dump
      if (pendingReason) {
        const next = pendingReason;
        pendingReason = null;
        runBackup(next);
      }
    }
  );
}

function triggerBackup(reason) {
  if (!enabled) return;
  if (running) {
    pendingReason = reason;
    return;
  }
  runBackup(reason);
}

module.exports = { triggerBackup };
