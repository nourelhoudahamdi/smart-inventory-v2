const db = process.env.NODE_ENV === "test"
? require("../../tests/test-database")
: require("../../database/database");

// Get all products
const getAllProducts = (req, res) => {
try {
const products = db.prepare("SELECT * FROM products").all();


    const productsWithStatus = products.map((product) => ({
        ...product,
        stock_status: product.quantity <= product.min_stock
            ? "Low Stock"
            : "Normal"
    }));

    res.json({
        status: "success",
        count: productsWithStatus.length,
        data: productsWithStatus
    });
} catch (error) {
    console.error("Error fetching products:", error.message);

    res.status(500).json({
        status: "error",
        message: "Failed to fetch products"
    });
}


};

// Create a product
const createProduct = (req, res) => {
try {
const { name, quantity, price } = req.body;
const min_stock = req.body.min_stock === undefined
? 5
: req.body.min_stock;


    if (
        typeof name !== "string" ||
        name.trim() === "" ||
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(min_stock) ||
        min_stock < 0
    ) {
        return res.status(400).json({
            status: "error",
            message: "Please provide a valid name, quantity, and price."
        });
    }

    const result = db.prepare(`
        INSERT INTO products (name, quantity, price, min_stock)
        VALUES (?, ?, ?, ?)
    `).run(name.trim(), quantity, price, min_stock);

    const newProduct = db.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json({
        status: "success",
        message: "Product added successfully",
        data: {
            ...newProduct,
            stock_status: newProduct.quantity <= newProduct.min_stock
                ? "Low Stock"
                : "Normal"
        }
    });
} catch (error) {
    console.error("Error adding products:", error.message);

    res.status(500).json({
        status: "error",
        message: "Failed to add product"
    });
}


};

// Update a product
const updateProduct = (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, quantity, price } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid product ID, name, quantity, and price."
            });
        }

        // Find the existing product first.
        const existingProduct = db.prepare(
            "SELECT * FROM products WHERE id = ?"
        ).get(id);

        if (!existingProduct) {
            return res.status(404).json({
                status: "error",
                message: "Product not found"
            });
        }

        // Preserve the current minimum stock if it wasn't provided.
        const min_stock = req.body.min_stock === undefined
            ? existingProduct.min_stock
            : req.body.min_stock;

        if (
            typeof name !== "string" || name.trim() === "" ||
            !Number.isInteger(quantity) || quantity < 0 ||
            typeof price !== "number" ||
            !Number.isFinite(price) || price < 0 ||
            !Number.isInteger(min_stock) ||
            min_stock < 0
        ) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid product ID, name, quantity, and price."
            });
        }

        db.prepare(`
            UPDATE products
            SET name = ?, quantity = ?, price = ?, min_stock = ?
            WHERE id = ?
        `).run(name.trim(), quantity, price, min_stock, id);

        const updatedProduct = db.prepare(
            "SELECT * FROM products WHERE id = ?"
        ).get(id);

        res.json({
            status: "success",
            message: "Product updated successfully",
            data: {
                ...updatedProduct,
                stock_status: updatedProduct.quantity <= updatedProduct.min_stock
                    ? "Low Stock"
                    : "Normal"
            }
        });
    } catch (error) {
        console.error("Error updating product:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to update product"
        });
    }
};


// Delete a product
const deleteProduct = (req, res) => {
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


};

module.exports = {
getAllProducts,
createProduct,
updateProduct,
deleteProduct
};

