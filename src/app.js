const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const dealRoutes = require("./routes/dealRoutes");
const ruleRoutes = require("./routes/ruleRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const stalenessRoutes = require("./routes/stalenessRoutes");
const teamRoutes = require("./routes/teamRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "StaleDealNagger API",
      version: "1.0.0",
      status: "running",
      docs: "/health",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/deals", dealRoutes);
app.use("/api/v1/rules", ruleRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/staleness", stalenessRoutes);
app.use("/api/v1", teamRoutes);
app.use("/api/v1/integrations", integrationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
