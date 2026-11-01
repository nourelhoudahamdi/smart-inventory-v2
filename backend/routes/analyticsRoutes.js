const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

// GET stock movement summary
router.get(
    "/stock-movements",
    analyticsController.getMovementSummary
);

// GET stock movement trends grouped by day
router.get(
    "/stock-movement-trends",
    analyticsController.getMovementTrends
);

// GET top 5 most active products
router.get(
    "/top-active-products",
    analyticsController.getTopActiveProducts
);

module.exports = router;
