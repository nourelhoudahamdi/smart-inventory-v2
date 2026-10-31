const express = require("express");
const supplierController = require("../controllers/supplierController");

const router = express.Router();

// GET all suppliers
router.get("/", supplierController.getAllSuppliers);

// GET one supplier
router.get("/:id", supplierController.getSupplierById);

// POST a new supplier
router.post("/", supplierController.createSupplier);

// PUT: update a supplier
router.put("/:id", supplierController.updateSupplier);

// DELETE: archive a supplier
router.delete("/:id", supplierController.archiveSupplier);

module.exports = router;