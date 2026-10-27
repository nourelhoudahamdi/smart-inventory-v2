const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

// Use the temporary database during tests.
const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// GET all products
router.get("/", productController.getAllProducts);

// POST a new product
router.post("/", productController.createProduct);

// PUT: update an existing product
router.put("/:id", productController.updateProduct);

// DELETE a product
router.delete("/:id", productController.deleteProduct);

module.exports = router;