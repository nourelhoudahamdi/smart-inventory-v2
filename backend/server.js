const express = require("express");
const path = require("path");

const productRoutes = require("./routes/productRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const salesRoutes = require("./routes/salesRoutes");
const profitRoutes = require("./routes/profitRoutes");
const salesAnalyticsRoutes = require("./routes/salesAnalyticsRoutes");
const inventoryPerformanceRoutes = require("./routes/inventoryPerformanceRoutes");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "10kb" }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Health check route
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "API is working correctly"
    });
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/profit", profitRoutes);
app.use("/api/sales-analytics", salesAnalyticsRoutes);
app.use("/api/inventory-performance", inventoryPerformanceRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    // Request payload too large
    if (err.type === "entity.too.large") {
        return res.status(413).json({
            status: "error",
            message: "Request payload is too large. Maximum size is 10KB."
        });
    }

    // Invalid JSON format
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            status: "error",
            message: "Invalid JSON format."
        });
    }

    // Other server errors
    return res.status(500).json({
        status: "error",
        message: "Internal server error."
    });
});

// Start the server only when this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export the app for automated tests
module.exports = app;