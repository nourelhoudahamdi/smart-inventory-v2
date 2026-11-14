const express = require("express");
const inventoryController = require("../controllers/inventoryPerformanceController");

const router = express.Router();

router.get("/summary", inventoryController.getInventorySummary);
router.get("/alerts", inventoryController.getInventoryAlerts);
router.get("/slow-moving", inventoryController.getSlowMovingProducts);

module.exports = router;