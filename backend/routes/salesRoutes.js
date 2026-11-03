const express = require("express");
const salesController = require("../controllers/salesController");

const router = express.Router();

// POST create a sale
router.post("/", salesController.createSale);

// GET all sales
router.get("/", salesController.getAllSales);

module.exports = router;