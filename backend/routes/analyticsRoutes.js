
const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

// GET stock movement summary
router.get(
    "/stock-movements",
    analyticsController.getMovementSummary
);

module.exports = router;
