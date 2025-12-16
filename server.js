const express = require("express");
require("dotenv").config();
const { sequelize, testConnection } = require("./config/database");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const fineRoutes = require("./routes/fineRoutes");

require("./models");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management System API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", bookRoutes);
app.use("/api", memberRoutes);
app.use("/api", transactionRoutes);
app.use("/api", fineRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

const startServer = async () => {
  try {
    await testConnection();

    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✓ Database synchronized successfully");

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
