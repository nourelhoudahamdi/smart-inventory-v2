const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
res.send("Smart Inventory & Supply Tracker - Server is running!");
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

// Start the server only when this file is run directly
if (require.main === module) {
app.listen(PORT, () => {
console.log(`Server running at http://localhost:${PORT}`);
});
}

// Export the app for automated tests
module.exports = app;

