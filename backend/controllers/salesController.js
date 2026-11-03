const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// POST create a sale
const createSale = (req, res) => {
    try {
        const productId = Number(req.body.product_id);
        const quantity = Number(req.body.quantity);

        // 1. Validate product ID
        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid product ID."
            });
        }

        // 2. Validate quantity
        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                status: "400",
                message: "Quantity must be a positive integer."
            });
        }

        // 3. Get the active product
        const product = db.prepare(`
            SELECT *
            FROM products
            WHERE id = ? AND is_active = 1
        `).get(productId);

        if (!product) {
            return res.status(404).json({
                status: "error",
                message: "Product not found."
            });
        }

        // 4. Check available stock
        if (product.quantity < quantity) {
            return res.status(400).json({
                status: "error",
                message: "Insufficient stock."
            });
        }

        // 5. Check product prices
        if (
            product.purchase_price === null ||
            product.selling_price === null
        ) {
            return res.status(400).json({
                status: "error",
                message: "Set purchase price and selling price before recording a sale."
            });
        }

        const unitPrice = product.selling_price;
        const unitCost = product.purchase_price;

        const totalRevenue = unitPrice * quantity;
        const totalCost = unitCost * quantity;

        // 6. Execute all database changes in one transaction
        const recordSale = db.transaction(() => {

            // Insert the sale
            const saleResult = db.prepare(`
                INSERT INTO sales (
                    product_id,
                    quantity,
                    unit_price,
                    unit_cost,
                    total_revenue,
                    total_cost
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                productId,
                quantity,
                unitPrice,
                unitCost,
                totalRevenue,
                totalCost
            );

            const saleId = Number(saleResult.lastInsertRowid);

            // Reduce product stock
            db.prepare(`
                UPDATE products
                SET quantity = quantity - ?
                WHERE id = ?
            `).run(quantity, productId);

            // Record stock OUT movement
            db.prepare(`
                INSERT INTO stock_movements (
                    product_id,
                    movement_type,
                    quantity,
                    reason
                )
                VALUES (?, 'OUT', ?, ?)
            `).run(
                productId,
                quantity,
                `Sale #${saleId}`
            );

            return db.prepare(`
                SELECT *
                FROM sales
                WHERE id = ?
            `).get(saleId);
        });

        const sale = recordSale();

        return res.status(201).json({
            status: "success",
            message: "Sale recorded successfully.",
            data: sale
        });

    } catch (error) {
        console.error("Create sale error:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to record sale."
        });
    }
};

// GET all sales
const getAllSales = (req, res) => {
    try {
        const sales = db.prepare(`
            SELECT
                sales.*,
                products.name AS product_name
            FROM sales
            INNER JOIN products
                ON sales.product_id = products.id
            ORDER BY sales.sold_at DESC, sales.id DESC
        `).all();

        return res.json({
            status: "success",
            count: sales.length,
            data: sales
        });

    } catch (error) {
        console.error("Get sales error:", error);

        return res.status(500).json({
            status: "error",
            message: "Failed to retrieve sales."
        });
    }
};

module.exports = {
    createSale,
    getAllSales
};