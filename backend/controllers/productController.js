const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// Validate optional prices
const isValidOptionalPrice = (price) => {
    return (
        price === null ||
        (
            typeof price === "number" &&
            Number.isFinite(price) &&
            price >= 0
        )
    );
};

// Get all active products
const getAllProducts = (req, res) => {
    try {
        const products = db.prepare(`
            SELECT
                p.*,
                s.name AS supplier_name
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.is_active = 1
        `).all();

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

// Check whether a supplier exists and is active
const isValidSupplier = (supplierId) => {
    if (supplierId === null || supplierId === undefined) {
        return true;
    }

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
        return false;
    }

    const supplier = db.prepare(`
        SELECT id
        FROM suppliers
        WHERE id = ? AND is_active = 1
    `).get(supplierId);

    return Boolean(supplier);
};

// Create a product
const createProduct = (req, res) => {
    try {
        const {
            name,
            quantity,
            price,
            purchase_price = null,
            selling_price = null,
            supplier_id = null
        } = req.body;

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
            !isValidOptionalPrice(purchase_price) ||
            !isValidOptionalPrice(selling_price) ||
            !Number.isInteger(min_stock) ||
            min_stock < 0 ||
            !isValidSupplier(supplier_id)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Please provide valid product information and supplier."
            });
        }

        const result = db.prepare(`
            INSERT INTO products (
                name,
                quantity,
                price,
                purchase_price,
                selling_price,
                min_stock,
                supplier_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            name.trim(),
            quantity,
            price,
            purchase_price,
            selling_price,
            min_stock,
            supplier_id
        );

        const newProduct = db.prepare(`
            SELECT
                p.*,
                s.name AS supplier_name
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
        `).get(result.lastInsertRowid);

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
        console.error("Error adding product:", error.message);

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
                message: "Please provide a valid product ID."
            });
        }

        // Find the existing active product
        const existingProduct = db.prepare(`
            SELECT *
            FROM products
            WHERE id = ? AND is_active = 1
        `).get(id);

        if (!existingProduct) {
            return res.status(404).json({
                status: "error",
                message: "Product not found"
            });
        }

        // Preserve current values when optional fields are omitted
        const min_stock = req.body.min_stock === undefined
            ? existingProduct.min_stock
            : req.body.min_stock;

        const supplier_id = req.body.supplier_id === undefined
            ? existingProduct.supplier_id
            : req.body.supplier_id;

        const purchase_price = req.body.purchase_price === undefined
            ? existingProduct.purchase_price
            : req.body.purchase_price;

        const selling_price = req.body.selling_price === undefined
            ? existingProduct.selling_price
            : req.body.selling_price;

        if (
            typeof name !== "string" ||
            name.trim() === "" ||
            !Number.isInteger(quantity) ||
            quantity < 0 ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0 ||
            !isValidOptionalPrice(purchase_price) ||
            !isValidOptionalPrice(selling_price) ||
            !Number.isInteger(min_stock) ||
            min_stock < 0 ||
            !isValidSupplier(supplier_id)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Please provide valid product information and supplier."
            });
        }

        db.prepare(`
            UPDATE products
            SET
                name = ?,
                quantity = ?,
                price = ?,
                purchase_price = ?,
                selling_price = ?,
                min_stock = ?,
                supplier_id = ?
            WHERE id = ?
        `).run(
            name.trim(),
            quantity,
            price,
            purchase_price,
            selling_price,
            min_stock,
            supplier_id,
            id
        );

        const updatedProduct = db.prepare(`
            SELECT
                p.*,
                s.name AS supplier_name
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ?
        `).get(id);

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

// Archive a product
const deleteProduct = (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid product ID."
            });
        }

        const result = db.prepare(`
            UPDATE products
            SET is_active = 0
            WHERE id = ? AND is_active = 1
        `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                status: "error",
                message: "Product not found"
            });
        }

        res.json({
            status: "success",
            message: "Product archived successfully"
        });
    } catch (error) {
        console.error("Error archiving product:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to archive product"
        });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
