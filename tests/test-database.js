const Database = require("better-sqlite3");

// Create a separate in-memory database for tests.
// It exists only in memory and does not modify inventory.db.
const db = new Database(":memory:");

// Create the products table.
db.exec(`    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`);

module.exports = db;
