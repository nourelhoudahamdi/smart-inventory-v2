
const Database = require("better-sqlite3");
const path = require("path");

// Use a separate database when a test explicitly requests it.
const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, "inventory.db");

// Open the database.
const db = new Database(dbPath);

// Create the products table if it does not exist.
db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

// Add min_stock if the column is missing.
const columns = db.prepare("PRAGMA table_info(products)").all();

const hasMinStock = columns.some(
    (column) => column.name === "min_stock"
);

if (!hasMinStock) {
    db.exec(`
        ALTER TABLE products
        ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 5
        CHECK (min_stock >= 0);
    `);

    console.log("Database migration successful: min_stock added.");
} else {
    console.log("Database migration skipped: min_stock already exists.");
}

// Create the stock movements history table.
db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
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

console.log("Database connected successfully!");
console.log("Products table is ready!");
console.log("Stock movements table is ready!");

module.exports = db;
