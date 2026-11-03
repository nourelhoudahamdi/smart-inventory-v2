const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");


// ======================================
// DATE FILTER HELPER
// ======================================

const getDateFilter = (req) => {
    const { startDate, endDate } = req.query;

    const conditions = [];
    const params = [];

    if (startDate) {
        conditions.push("DATE(sales.sold_at) >= DATE(?)");
        params.push(startDate);
    }

    if (endDate) {
        conditions.push("DATE(sales.sold_at) <= DATE(?)");
        params.push(endDate);
    }

    return {
        whereClause: conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "",
        params
    };
};


// ======================================
// 1. PROFIT SUMMARY
// ======================================

const getProfitSummary = (req, res) => {
    try {
        const { whereClause, params } = getDateFilter(req);

        const totals = db.prepare(`
            SELECT
                COALESCE(SUM(sales.total_revenue), 0) AS total_revenue,
                COALESCE(SUM(sales.total_cost), 0) AS total_cost
            FROM sales
            ${whereClause}
        `).get(...params);

        const grossProfit =
            totals.total_revenue - totals.total_cost;

        const profitMargin = totals.total_revenue > 0
            ? (grossProfit / totals.total_revenue) * 100
            : 0;

        res.json({
            status: "success",
            data: {
                total_revenue: totals.total_revenue,
                total_cost: totals.total_cost,
                gross_profit: grossProfit,
                profit_margin: Number(profitMargin.toFixed(2))
            }
        });

    } catch (error) {
        console.error("Error fetching profit summary:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch profit summary."
        });
    }
};


// ======================================
// 2. PROFIT BY PRODUCT
// ======================================

const getProfitByProduct = (req, res) => {
    try {
        const { whereClause, params } = getDateFilter(req);

        const products = db.prepare(`
            SELECT
                products.id AS product_id,
                products.name AS product_name,

                SUM(sales.quantity) AS total_quantity_sold,

                SUM(sales.total_revenue) AS total_revenue,

                SUM(sales.total_cost) AS total_cost,

                SUM(sales.total_revenue - sales.total_cost)
                    AS gross_profit,

                CASE
                    WHEN SUM(sales.total_revenue) > 0
                    THEN ROUND(
                        (
                            SUM(sales.total_revenue - sales.total_cost)
                            / SUM(sales.total_revenue)
                        ) * 100,
                        2
                    )
                    ELSE 0
                END AS profit_margin

            FROM sales

            INNER JOIN products
                ON sales.product_id = products.id

            ${whereClause}

            GROUP BY products.id, products.name

            ORDER BY gross_profit DESC
        `).all(...params);

        res.json({
            status: "success",
            data: products
        });

    } catch (error) {
        console.error("Error fetching profit by product:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch profit by product."
        });
    }
};


// ======================================
// 3. PROFIT TRENDS
// ======================================

const getProfitTrends = (req, res) => {
    try {
        const { whereClause, params } = getDateFilter(req);

        const trends = db.prepare(`
            SELECT
                DATE(sales.sold_at) AS sale_date,

                SUM(sales.total_revenue) AS total_revenue,

                SUM(sales.total_cost) AS total_cost,

                SUM(sales.total_revenue - sales.total_cost)
                    AS gross_profit

            FROM sales

            ${whereClause}

            GROUP BY DATE(sales.sold_at)

            ORDER BY sale_date ASC
        `).all(...params);

        res.json({
            status: "success",
            data: trends
        });

    } catch (error) {
        console.error("Error fetching profit trends:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch profit trends."
        });
    }
};


// ======================================
// EXPORT CONTROLLERS
// ======================================

module.exports = {
    getProfitSummary,
    getProfitByProduct,
    getProfitTrends
};