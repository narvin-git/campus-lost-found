function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ message: "Server error", detail: err.message });
}

module.exports = { notFound, errorHandler };