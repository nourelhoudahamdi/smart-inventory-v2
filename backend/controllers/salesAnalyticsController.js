const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// DATE FILTER HELPER

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
// 1. SALES SUMMARY
// ======================================

const getSalesSummary = (req, res) => {
    try {
        const { whereClause, params } = getDateFilter(req);

        const summary = db.prepare(`
            SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(sales.total_revenue), 0) AS total_revenue,
                COALESCE(SUM(sales.quantity), 0) AS total_quantity_sold,
                COALESCE(AVG(sales.total_revenue), 0) AS average_sale_value
            FROM sales
            ${whereClause}
        `).get(...params);

        res.json({
            status: "success",
            data: summary
        });

    } catch (error) {
        console.error("Error fetching sales summary:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch sales summary."
        });
    }
};

// ======================================
// 2. SALES TRENDS
// ======================================

const getSalesTrends = (req, res) => {
    try {
        const { whereClause, params } = getDateFilter(req);

        const trends = db.prepare(`
            SELECT
                DATE(sales.sold_at) AS sale_date,
                COUNT(*) AS total_sales,
                SUM(sales.quantity) AS total_quantity_sold,
                SUM(sales.total_revenue) AS total_revenue

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
        console.error("Error fetching sales trends:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch sales trends."
        });
    }
};

// ======================================
// 3. TOP SELLING PRODUCTS
// ======================================

const getTopSellingProducts = (req, res) => {
    try {
        const { whereClause, params } = getDateFilter(req);

        const products = db.prepare(`
            SELECT
                products.id AS product_id,
                products.name AS product_name,
                SUM(sales.quantity) AS total_quantity_sold,
                SUM(sales.total_revenue) AS total_revenue,
                COUNT(sales.id) AS total_sales

            FROM sales

            INNER JOIN products
                ON sales.product_id = products.id

            ${whereClause}

            GROUP BY products.id, products.name

            ORDER BY total_quantity_sold DESC

            LIMIT 5
        `).all(...params);

        res.json({
            status: "success",
            data: products
        });

    } catch (error) {
        console.error("Error fetching top selling products:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch top selling products."
        });
    }
};

// ======================================
// EXPORT CONTROLLERS
// ======================================

module.exports = {
    getSalesSummary,
    getSalesTrends,
    getTopSellingProducts
};