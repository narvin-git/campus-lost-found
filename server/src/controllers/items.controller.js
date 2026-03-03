const pool = require("../db");

async function createItem(req, res, next) {
  try {
    const { title, description, category, location, date, contact } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO items (title, description, category, location, date, contact, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [title, description, category, location, date, contact]
    );

    res.status(201).json({ message: "Item created", id: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function listItems(req, res, next) {
  try {
    const { category } = req.query;

    let sql = "SELECT * FROM items";
    const params = [];

    if (category === "Lost" || category === "Found") {
      sql += " WHERE category = ?";
      params.push(category);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute("SELECT * FROM items WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Item not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateItemStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const [result] = await pool.execute(
      "UPDATE items SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Status updated" });
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.execute("DELETE FROM items WHERE id = ?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { createItem, listItems, getItem, updateItemStatus, deleteItem };