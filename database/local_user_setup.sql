-- Local MySQL 8.0: dedicated least-privilege application user.
-- Run as root AFTER schema.sql. Replace the placeholder password before running.
-- Never commit the real password.

CREATE DATABASE IF NOT EXISTS campus_lost_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 'localhost' only: the account cannot be used from any other machine
CREATE USER IF NOT EXISTS 'lostfound_app'@'localhost'
  IDENTIFIED BY '<CHOOSE-A-STRONG-PASSWORD>';

-- Data access only (no CREATE/DROP/ALTER/GRANT), and only on this one database
GRANT SELECT, INSERT, UPDATE, DELETE
  ON campus_lost_found.*
  TO 'lostfound_app'@'localhost';

FLUSH PRIVILEGES;

-- Appendix F screenshot
SHOW GRANTS FOR 'lostfound_app'@'localhost';
