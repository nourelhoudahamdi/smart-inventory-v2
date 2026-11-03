const express = require("express");
const profitController = require("../controllers/profitController");

const router = express.Router();

router.get("/summary", profitController.getProfitSummary);
router.get("/products", profitController.getProfitByProduct);
router.get("/trends", profitController.getProfitTrends);

module.exports = router;