const express = require("express");
const router = express.Router();

const {
  createItem,
  listItems,
  getItem,
  updateItemStatus,
  deleteItem
} = require("../controllers/items.controller");

const {
  validateItemCreate,
  validateStatusUpdate
} = require("../middleware/validate.middleware");

// GET, POST, PATCH, DELETE required :contentReference[oaicite:1]{index=1}
router.get("/", listItems);
router.get("/:id", getItem);
router.post("/", validateItemCreate, createItem);
router.patch("/:id/status", validateStatusUpdate, updateItemStatus);
router.delete("/:id", deleteItem);

module.exports = router;