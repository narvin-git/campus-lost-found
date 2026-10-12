-- Campus Lost & Found: database schema (items only)
-- Idempotent: safe to run repeatedly. Compatible with MySQL 8.0 and TiDB Cloud.
-- Columns derived from server/src/controllers/items.controller.js and
-- server/src/middleware/validate.middleware.js.

CREATE DATABASE IF NOT EXISTS campus_lost_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_lost_found;

CREATE TABLE IF NOT EXISTS items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(120) NOT NULL,                          -- validator: 3-120 chars
  description TEXT         NOT NULL,                          -- validator: min 5 chars
  category    ENUM('Lost', 'Found') NOT NULL,                 -- validator: Lost | Found
  location    VARCHAR(255) NOT NULL,
  `date`      DATE         NOT NULL,                          -- date item was lost/found
  contact     VARCHAR(255) NOT NULL,
  status      ENUM('Active', 'Claimed', 'Resolved') NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP, -- used by ORDER BY created_at DESC
  PRIMARY KEY (id),
  -- GET /api/items?category=... ORDER BY created_at DESC
  KEY idx_items_category_created (category, created_at),
  -- GET /api/items ORDER BY created_at DESC
  KEY idx_items_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
