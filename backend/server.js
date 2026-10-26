const express = require("express");
const cors = require("cors");

// Use the temporary database during tests.
const db = process.env.NODE_ENV === "test"
? require("../tests/test-database")
: require("../database/database");

const app = express();



const PORT = 3000;

// Allow the server to receive JSON data
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
res.send("Smart Inventory & Supply Tracker - Server is running!");
});

// Test route for the API
app.get("/api/health", (req, res) => {
res.json({
status: "success",
message: "API is working correctly"
});
});

app.get("/api/products", (req, res) => {
try {
const products = db.prepare("SELECT * FROM products").all();


    res.json({
        status: "success",
        count: products.length,
        data: products
    });
} catch (error) {
    console.error("Error fetching products:", error.message);

    res.status(500).json({
        status: "error",
        message: "Failed to fetch products"
    });
}


});

app.post("/api/products", (req, res) => {
try {
const { name, quantity, price } = req.body;


    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return res.status(400).json({
            status: "error",
            message: "Please provide a valid name, quantity, and price."
        });
    }

    const result = db.prepare(`
        INSERT INTO products (name, quantity, price)
        VALUES (?, ?, ?)
    `).run(name.trim(), quantity, price);

    const newProduct = db.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json({
        status: "success",
        message: "Product added successfully",
        data: newProduct
    });
} catch (error) {
    console.error("Error adding product:", error.message);

    res.status(500).json({
        status: "error",
        message: "Failed to add product"
    });
}


});

// Update an existing product
app.put("/api/products/:id", (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, quantity, price } = req.body;

        if (
            !Number.isInteger(id) || id <= 0 ||
            typeof name !== "string" || name.trim() === "" ||
            !Number.isInteger(quantity) || quantity < 0 ||
            typeof price !== "number" || !Number.isFinite(price) || price < 0
        ) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid product ID, name, quantity, and price."
            });
        }

        const result = db.prepare(`
            UPDATE products
            SET name = ?, quantity = ?, price = ?
            WHERE id = ?
        `).run(name.trim(), quantity, price, id);

        if (result.changes === 0) {
            return res.status(404).json({
                status: "error",
                message: "Product not found"
            });
        }

        const updatedProduct = db.prepare(
            "SELECT * FROM products WHERE id = ?"
        ).get(id);

        res.json({
            status: "success",
            message: "Product updated successfully",
            data: updatedProduct
        });
    } catch (error) {
        console.error("Error updating product:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to update product"
        });
    }
});

// Delete a product
app.delete("/api/products/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid product ID."
            });
        }

        const result = db.prepare(
            "DELETE FROM products WHERE id = ?"
        ).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                status: "error",
                message: "Product not found"
            });
        }

        res.json({
            status: "success",
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting product:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to delete product"
        });
    }
});

// Start the server only when this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export the app for automated tests
module.exports = app;
