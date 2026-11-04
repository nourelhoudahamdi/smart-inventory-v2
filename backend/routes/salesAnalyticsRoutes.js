const express = require("express");
const salesAnalyticsController = require("../controllers/salesAnalyticsController");

const router = express.Router();

// GET sales summary
router.get("/summary", salesAnalyticsController.getSalesSummary);

// GET sales trends
router.get("/trends", salesAnalyticsController.getSalesTrends);

// GET top selling products
router.get("/top-products", salesAnalyticsController.getTopSellingProducts);

module.exports = router;