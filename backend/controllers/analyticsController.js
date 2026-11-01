const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// Get stock movement summary
const getMovementSummary = (req, res) => {
    try {
        // Calculate total IN and OUT quantities
        const totals = db.prepare(`
            SELECT
                COALESCE(SUM(
                    CASE WHEN movement_type = 'IN'
                    THEN quantity ELSE 0 END
                ), 0) AS total_in,

                COALESCE(SUM(
                    CASE WHEN movement_type = 'OUT'
                    THEN quantity ELSE 0 END
                ), 0) AS total_out

            FROM stock_movements
        `).get();

        // Calculate net movement
        const netMovement = totals.total_in - totals.total_out;

        // Keep detailed movement data
        const data = db.prepare(`
            SELECT
                movement_type,
                COUNT(*) AS total_movements,
                SUM(quantity) AS total_quantity
            FROM stock_movements
            GROUP BY movement_type
        `).all();

        res.json({
            status: "success",

            summary: {
                total_in: totals.total_in,
                total_out: totals.total_out,
                net_movement: netMovement
            },

            data: data
        });

    } catch (error) {
        console.error("Error fetching movement summary:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch movement summary."
        });
    }
};

// Get stock movement trends grouped by day
const getMovementTrends = (req, res) => {
    try {
        const trends = db.prepare(`
            SELECT
                date(created_at) AS movement_date,

                SUM(
                    CASE
                        WHEN movement_type = 'IN'
                        THEN quantity ELSE 0
                    END
                ) AS total_in,

                SUM(
                    CASE
                        WHEN movement_type = 'OUT'
                        THEN quantity ELSE 0
                    END
                ) AS total_out

            FROM stock_movements

            GROUP BY date(created_at)

            ORDER BY movement_date ASC
        `).all();

        res.json({
            status: "success",
            data: trends
        });

    } catch (error) {
        console.error("Error fetching movement trends:", error.message);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch movement trends."
        });
    }
};

module.exports = {
    getMovementSummary,
    getMovementTrends
};