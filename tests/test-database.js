const Database = require("better-sqlite3");

// Create an isolated in-memory database for automated tests.
const db = new Database(":memory:");

// Enable foreign key enforcement.
db.pragma("foreign_keys = ON");

// Create the suppliers table.
db.exec(`
    CREATE TABLE suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER NOT NULL DEFAULT 1
            CHECK (is_active IN (0, 1))
    );
`);

// Create the products table.
db.exec(`
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        purchase_price REAL
            CHECK (purchase_price IS NULL OR purchase_price >= 0),
        selling_price REAL
            CHECK (selling_price IS NULL OR selling_price >= 0),
        min_stock INTEGER NOT NULL DEFAULT 5
            CHECK (min_stock >= 0),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER NOT NULL DEFAULT 1
            CHECK (is_active IN (0, 1)),
        supplier_id INTEGER,
        FOREIGN KEY (supplier_id)
            REFERENCES suppliers(id)
            ON DELETE SET NULL
    );
`);

// Create the stock movements history table.
db.exec(`
    CREATE TABLE stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL
            CHECK (movement_type IN ('IN', 'OUT')),
        quantity INTEGER NOT NULL
            CHECK (quantity > 0),
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE RESTRICT
    );
`);

// Create the sales history table.
db.exec(`
    CREATE TABLE sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price REAL NOT NULL CHECK (unit_price >= 0),
        unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
        total_revenue REAL NOT NULL CHECK (total_revenue >= 0),
        total_cost REAL NOT NULL CHECK (total_cost >= 0),
        sold_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE RESTRICT
    );
`);

module.exports = db;