const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// Get inventory performance summary
const getInventorySummary = (req, res) => {
    try {
        const summary = db.prepare(`
            SELECT
                COUNT(*) AS total_products,

                COALESCE(SUM(quantity), 0) AS total_units,

                COALESCE(SUM(
                    CASE
                        WHEN purchase_price IS NOT NULL
                        THEN quantity * purchase_price
                        ELSE 0
                    END
                ), 0) AS total_stock_value,

                SUM(
                    CASE
                        WHEN quantity = 0 THEN 1
                        ELSE 0
                    END
                ) AS out_of_stock,

                SUM(
                    CASE
                        WHEN quantity > 0 AND quantity <= min_stock
                        THEN 1
                        ELSE 0
                    END
                ) AS low_stock,

                SUM(
                    CASE
                        WHEN quantity > min_stock THEN 1
                        ELSE 0
                    END
                ) AS healthy_stock

            FROM products
            WHERE is_active = 1
        `).get();

        res.json({
            status: "success",
            data: summary
        });

    } catch (error) {
        console.error("Inventory summary error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch inventory summary."
        });
    }
};

// Get products requiring attention
const getInventoryAlerts = (req, res) => {
    try {
        const products = db.prepare(`
            SELECT
                id,
                name,
                quantity,
                min_stock,
                purchase_price,
                CASE
                    WHEN quantity = 0 THEN 'Out of Stock'
                    ELSE 'Low Stock'
                END AS stock_status
            FROM products
            WHERE is_active = 1
              AND quantity <= min_stock
            ORDER BY quantity ASC
        `).all();

        res.json({
            status: "success",
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error("Inventory alerts error:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch inventory alerts."
        });
    }
};

// Get slow-moving products
const getSlowMovingProducts = (req, res) => {
    try {
        const products = db.prepare(`
            SELECT
                products.id AS product_id,
                products.name AS product_name,
                products.quantity AS current_stock,

                MAX(sales.sold_at) AS last_sale_date,

                CAST(
                    julianday('now') -
                    julianday(MAX(sales.sold_at))
                    AS INTEGER
                ) AS days_since_last_sale

            FROM products

            LEFT JOIN sales
                ON products.id = sales.product_id

            WHERE products.is_active = 1

            GROUP BY products.id, products.name, products.quantity

            HAVING
                MAX(sales.sold_at) IS NULL
                OR MAX(sales.sold_at) <= datetime('now', '-30 days')

            ORDER BY
                CASE
                    WHEN last_sale_date IS NULL THEN 0
                    ELSE 1
                END,
                last_sale_date ASC

        `).all();

        res.json({
            status: "success",
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error("Slow-moving products error:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch slow-moving products."
        });
    }
};

module.exports = {
    getInventorySummary,
    getInventoryAlerts,
    getSlowMovingProducts
};