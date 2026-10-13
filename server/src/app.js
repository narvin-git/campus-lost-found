require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const itemsRoutes = require("./routes/items.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
// Unset or 0 = limiter off (production default); set a number to cap API requests per IP per 15 min
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 0;

// middleware required :[oaicite:2]{index=2}
// Keep Helmet's default CSP except upgrade-insecure-requests, which makes browsers
// fetch CSS/JS over https and breaks plain-HTTP access via a LAN IP (phone test)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: { upgradeInsecureRequests: null },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance: cache static assets for faster repeat loads
app.use((req, res, next) => {
  // Never cache API responses
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
    return next();
  }
  next();
});

// serve client folder ("/" serves index.html; home.html is served as a static file)
app.use(
  express.static(path.join(__dirname, "../../client"), {
    maxAge: "1d",
    etag: true,
  })
);

if (RATE_LIMIT_MAX > 0) {
  // Behind Apache (local) or Render's proxy, trust X-Forwarded-For so limits apply per client IP
  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: RATE_LIMIT_MAX,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later." },
    })
  );
}

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

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Rate limiter: ${RATE_LIMIT_MAX > 0 ? `${RATE_LIMIT_MAX} req / 15 min per IP on /api` : "off"}`);
});
