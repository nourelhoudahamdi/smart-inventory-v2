const express = require("express");
const cors = require("cors");
const path = require("path");
const productRoutes = require("./routes/productRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const salesRoutes = require("./routes/salesRoutes");
const profitRoutes = require("./routes/profitRoutes");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Product routes
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/profit", profitRoutes);

// Start the server only when this file is run directly
if (require.main === module) {
app.listen(PORT, () => {
console.log(`Server running at http://localhost:${PORT}`);
});
}

// Export the app for automated tests
module.exports = app;

