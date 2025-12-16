const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { pool } = require("./config/database");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Import routes
const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const fineRoutes = require("./routes/fineRoutes");


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management System API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api", bookRoutes);
app.use("/api", memberRoutes);
app.use("/api", transactionRoutes);
app.use("/api", fineRoutes);

// 404 handler --- 
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize database schema
const initializeDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, "config", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schema);
    console.log("✓ Database schema initialized successfully");
  } catch (error) {
    console.error("✗ Database initialization failed:", error.message);
    throw error;
  }
};

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    console.log("✓ Database connection established");

    // Initialize database schema (only if tables don't exist)
    if (process.env.INIT_DB === "true") {
      await initializeDatabase();
    }

    // Start server
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
