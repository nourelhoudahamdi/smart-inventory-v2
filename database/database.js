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

// Check whether the min_stock column already exists.
const columns = db.prepare("PRAGMA table_info(products)").all();

const hasMinStock = columns.some(
    (column) => column.name === "min_stock"
);

// Add min_stock only if it is missing.
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

console.log("Database connected successfully!");
console.log("Products table is ready!");

module.exports = db;


