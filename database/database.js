const Database = require("better-sqlite3");
const path = require("path");

// Use a separate database when a test explicitly requests it.
const dbPath = process.env.DB_PATH
? path.resolve(process.env.DB_PATH)
: path.join(__dirname, "inventory.db");

// Open the database.
const db = new Database(dbPath);

// Create the products table if it does not exist.
db.exec(`    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`);

console.log("Database connected successfully!");
console.log("Products table is ready!");

module.exports = db;

