require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");

const itemsRoutes = require("./routes/items.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware required :[oaicite:2]{index=2}
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance: cache static assets for faster repeat loads
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
  next();
});


// serve client folder later
app.use(express.static(path.join(__dirname, "../../client")));

// api
app.use("/api/items", itemsRoutes);

// 404 + error handling required :{index=3}
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Route not found" });
  }
  return res.status(404).sendFile(path.join(__dirname, "../../client/404.html"));
});
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));