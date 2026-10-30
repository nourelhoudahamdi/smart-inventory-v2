
const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// Register a stock IN or OUT movement.
function createMovement(req, res) {
    const productId = Number(req.params.id);
    const { movement_type, quantity, reason } = req.body;

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Invalid product ID."
        });
    }

    if (!["IN", "OUT"].includes(movement_type)) {
        return res.status(400).json({
            status: "error",
            message: "movement_type must be IN or OUT."
        });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Quantity must be a positive integer."
        });
    }

    if (typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({
            status: "error",
            message: "A reason is required."
        });
    }

    try {
        const registerMovement = db.transaction(() => {
            const product = db.prepare(
                "SELECT id, quantity FROM products WHERE id = ?"
            ).get(productId);

            if (!product) {
                const error = new Error("Product not found.");
                error.statusCode = 404;
                throw error;
            }

            if (
                movement_type === "OUT" &&
                quantity > product.quantity
            ) {
                const error = new Error(
                    "Insufficient stock for this movement."
                );
                error.statusCode = 400;
                throw error;
            }

            const newQuantity = movement_type === "IN"
                ? product.quantity + quantity
                : product.quantity - quantity;

            db.prepare(
                "UPDATE products SET quantity = ? WHERE id = ?"
            ).run(newQuantity, productId);

            const result = db.prepare(`
                INSERT INTO stock_movements
                    (product_id, movement_type, quantity, reason)
                VALUES (?, ?, ?, ?)
            `).run(
                productId,
                movement_type,
                quantity,
                reason.trim()
            );

            return {
                movementId: Number(result.lastInsertRowid),
                productId,
                movement_type,
                quantity,
                previousQuantity: product.quantity,
                newQuantity,
                reason: reason.trim()
            };
        });

        const movement = registerMovement();

        return res.status(201).json({
            status: "success",
            message: "Stock movement recorded successfully.",
            data: movement
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "error",
                message: error.message
            });
        }

        console.error("Error recording stock movement:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to record stock movement."
        });
    }
}

// Get the movement history of one product.
function getProductMovements(req, res) {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Invalid product ID."
        });
    }

    try {
        const product = db.prepare(
            "SELECT id FROM products WHERE id = ?"
        ).get(productId);

        if (!product) {
            return res.status(404).json({
                status: "error",
                message: "Product not found."
            });
        }

        const movements = db.prepare(`
            SELECT id, product_id, movement_type, quantity, reason, created_at
            FROM stock_movements
            WHERE product_id = ?
            ORDER BY id DESC
        `).all(productId);

        return res.status(200).json({
            status: "success",
            count: movements.length,
            data: movements
        });
    } catch (error) {
        console.error("Error retrieving stock movements:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve stock movements."
        });
    }
}

module.exports = {
    createMovement,
    getProductMovements
};
