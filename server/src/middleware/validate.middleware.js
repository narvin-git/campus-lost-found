const xss = require("xss");

function cleanStr(v) {
  return xss(String(v ?? "").trim());
}

function validateItemCreate(req, res, next) {
  const title = cleanStr(req.body.title);
  const description = cleanStr(req.body.description);
  const category = cleanStr(req.body.category);
  const location = cleanStr(req.body.location);
  const date = cleanStr(req.body.date);
  const contact = cleanStr(req.body.contact);

  if (!title || title.length < 3 || title.length > 120) {
    return res.status(400).json({ message: "Title must be 3–120 characters." });
  }
  if (!description || description.length < 5) {
    return res.status(400).json({ message: "Description must be at least 5 characters." });
  }
  if (!["Lost", "Found"].includes(category)) {
    return res.status(400).json({ message: "Category must be Lost or Found." });
  }
  if (!location) return res.status(400).json({ message: "Location is required." });
  if (!date || Number.isNaN(Date.parse(date))) {
    return res.status(400).json({ message: "Valid date is required." });
  }
  if (!contact) return res.status(400).json({ message: "Contact is required." });

  req.body = { title, description, category, location, date, contact };
  next();
}

function validateStatusUpdate(req, res, next) {
  const status = cleanStr(req.body.status);
  if (!["Active", "Claimed", "Resolved"].includes(status)) {
    return res.status(400).json({ message: "Status must be Active/Claimed/Resolved." });
  }
  req.body.status = status;
  next();
}

module.exports = { validateItemCreate, validateStatusUpdate };