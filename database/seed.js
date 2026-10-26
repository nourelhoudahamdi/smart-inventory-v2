const db = require("./database");

// Insert sample products
const insertProduct = db.prepare(`    INSERT INTO products (name, quantity, price)
    VALUES (?, ?, ?)`);

const products = [
["Laptop", 10, 7500],
["Keyboard", 25, 250],
["Mouse", 40, 120]
];

const insertMany = db.transaction((items) => {
for (const product of items) {
insertProduct.run(...product);
}
});

insertMany(products);

console.log("Sample products inserted successfully!");

const allProducts = db.prepare("SELECT * FROM products").all();

console.log(allProducts);

db.close();
