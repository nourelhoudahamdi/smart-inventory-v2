const db = process.env.NODE_ENV === "test"
    ? require("../../tests/test-database")
    : require("../../database/database");

// GET all active suppliers
const getAllSuppliers = (req, res) => {
    try {
        const suppliers = db.prepare(`
            SELECT
                s.*,
                COUNT(p.id) AS products_count
            FROM suppliers s
            LEFT JOIN products p
                ON p.supplier_id = s.id
                AND p.is_active = 1
            WHERE s.is_active = 1
            GROUP BY s.id
            ORDER BY s.id DESC
        `).all();

        res.json({
            status: "success",
            count: suppliers.length,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to retrieve suppliers."
        });
    }
};

// GET one supplier
const getSupplierById = (req, res) => {
    try {
        const supplier = db.prepare(`
            SELECT * FROM suppliers
            WHERE id = ? AND is_active = 1
        `).get(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                status: "error",
                message: "Supplier not found."
            });
        }

        res.json({
            status: "success",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to retrieve supplier."
        });
    }
};

// POST create supplier
const createSupplier = (req, res) => {
    try {
        const { name, phone, email, address } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Supplier name is required."
            });
        }

        const result = db.prepare(`
            INSERT INTO suppliers (name, phone, email, address)
            VALUES (?, ?, ?, ?)
        `).run(
            name.trim(),
            phone || null,
            email || null,
            address || null
        );

        const supplier = db.prepare(`
            SELECT * FROM suppliers WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            status: "success",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to create supplier."
        });
    }
};

// PUT update supplier
const updateSupplier = (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, phone, email, address } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid supplier ID."
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Supplier name is required."
            });
        }

        const result = db.prepare(`
            UPDATE suppliers
            SET name = ?, phone = ?, email = ?, address = ?
            WHERE id = ? AND is_active = 1
        `).run(
            name.trim(),
            phone || null,
            email || null,
            address || null,
            id
        );

        if (result.changes === 0) {
            return res.status(404).json({
                status: "error",
                message: "Supplier not found."
            });
        }

        const supplier = db.prepare(`
            SELECT * FROM suppliers WHERE id = ?
        `).get(id);

        res.json({
            status: "success",
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to update supplier."
        });
    }
};

// DELETE archive supplier
const archiveSupplier = (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid supplier ID."
            });
        }

        const result = db.prepare(`
            UPDATE suppliers
            SET is_active = 0
            WHERE id = ? AND is_active = 1
        `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                status: "error",
                message: "Supplier not found."
            });
        }

        res.json({
            status: "success",
            message: "Supplier archived successfully."
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to archive supplier."
        });
    }
};

module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    archiveSupplier
};