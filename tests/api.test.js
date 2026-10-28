process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../backend/server");

test("GET /api/health returns success", async (t) => {
const server = app.listen(0);


await new Promise((resolve) => server.once("listening", resolve));

t.after(() => new Promise((resolve, reject) => {
    server.close((error) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
}));

const address = server.address();
const response = await fetch(
    `http://127.0.0.1:${address.port}/api/health`
);

assert.equal(response.status, 200);

const body = await response.json();

assert.equal(body.status, "success");
assert.equal(body.message, "API is working correctly");


});


test("GET /api/products returns the product list", async (t) => {
    const db = require("./test-database");

    db.prepare("DELETE FROM products").run();

    const insertProduct = db.prepare(`
        INSERT INTO products (name, quantity, price)
        VALUES (?, ?, ?)
    `);

    insertProduct.run("Laptop", 10, 7500);
    insertProduct.run("Keyboard", 25, 250);
    insertProduct.run("Mouse", 40, 120);
    insertProduct.run("Monitor", 20, 1800);
    insertProduct.run("USB Cable", 5, 45);

    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products`
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.status, "success");
    assert.equal(body.count, 5);
    assert.equal(body.data.length, 5);
});


test("POST /api/products creates a new product", async (t) => {
    const db = require("./test-database");

    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Test Product",
                quantity: 10,
                price: 99.99
            })
        }
    );

    assert.equal(response.status, 201);

    const product = db.prepare(
        "SELECT * FROM products WHERE name = ?"
    ).get("Test Product");

    assert.ok(product);
    assert.equal(product.quantity, 10);
    assert.equal(product.price, 99.99);
});


test("POST /api/products rejects an empty product name", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "",
                quantity: 10,
                price: 99.99
            })
        }
    );

    assert.equal(response.status, 400);
});


test("POST /api/products rejects a negative quantity", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Invalid Product",
                quantity: -5,
                price: 99.99
            })
        }
    );

    assert.equal(response.status, 400);
});


test("POST /api/products rejects a negative price", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Invalid Price Product",
                quantity: 5,
                price: -50
            })
        }
    );

    assert.equal(response.status, 400);
});


test("PUT /api/products updates an existing product", async (t) => {
    const db = require("./test-database");

    // Add a product to the temporary database.
    const insertResult = db.prepare(`
        INSERT INTO products (name, quantity, price)
        VALUES (?, ?, ?)
    `).run("Product To Update", 5, 100);

    const productId = insertResult.lastInsertRowid;

    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/${productId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Updated Product",
                quantity: 15,
                price: 250
            })
        }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.status, "success");
    assert.equal(body.data.name, "Updated Product");
    assert.equal(body.data.quantity, 15);
    assert.equal(body.data.price, 250);
});


test("DELETE /api/products deletes an existing product", async (t) => {
    const db = require("./test-database");

    // Add a product to the temporary database.
    const insertResult = db.prepare(`
        INSERT INTO products (name, quantity, price)
        VALUES (?, ?, ?)
    `).run("Product To Delete", 3, 50);

    const productId = insertResult.lastInsertRowid;

    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/${productId}`,
        {
            method: "DELETE"
        }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.status, "success");

    // Verify that the product was deleted from the database.
    const deletedProduct = db.prepare(
        "SELECT * FROM products WHERE id = ?"
    ).get(productId);

    assert.equal(deletedProduct, undefined);
});


test("DELETE /api/products returns 404 for a nonexistent product", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/999999`,
        {
            method: "DELETE"
        }
    );

    assert.equal(response.status, 404);

    const body = await response.json();

    assert.equal(body.status, "error");
    assert.equal(body.message, "Product not found");
});


test("PUT /api/products returns 404 for a nonexistent product", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/999999`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Nonexistent Product",
                quantity: 10,
                price: 100
            })
        }
    );

    assert.equal(response.status, 404);

    const body = await response.json();

    assert.equal(body.status, "error");
    assert.equal(body.message, "Product not found");
});


test("PUT /api/products rejects a negative quantity", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/1`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Invalid Product",
                quantity: -5,
                price: 100
            })
        }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.status, "error");
});


test("PUT /api/products rejects a negative price", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/1`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Invalid Price Product",
                quantity: 5,
                price: -50
            })
        }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.status, "error");
});


test("PUT /api/products rejects an empty product name", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/1`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "   ",
                quantity: 5,
                price: 100
            })
        }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.status, "error");
});


test("DELETE /api/products rejects an invalid product ID", async (t) => {
    const server = app.listen(0);

    await new Promise((resolve) => server.once("listening", resolve));

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }));

    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}/api/products/abc`,
        {
            method: "DELETE"
        }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(body.status, "error");
    assert.equal(body.message, "Please provide a valid product ID.");
});

test("POST /api/products accepts a custom min_stock", async (t) => {
const db = require("./test-database");
const server = app.listen(0);


await new Promise((resolve) => server.once("listening", resolve));
t.after(() => new Promise((resolve) => server.close(resolve)));

const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/products`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Stock Alert Test",
            quantity: 8,
            price: 100,
            min_stock: 10
        })
    }
);

assert.equal(response.status, 201);

const body = await response.json();
assert.equal(body.data.min_stock, 10);
assert.equal(body.data.stock_status, "Low Stock");

db.prepare("DELETE FROM products WHERE name = ?").run("Stock Alert Test");


});

test("POST /api/products defaults min_stock to 5", async (t) => {
const db = require("./test-database");
const server = app.listen(0);


await new Promise((resolve) => server.once("listening", resolve));
t.after(() => new Promise((resolve) => server.close(resolve)));

const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/products`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Default Stock Test",
            quantity: 10,
            price: 50
        })
    }
);

assert.equal(response.status, 201);

const body = await response.json();
assert.equal(body.data.min_stock, 5);
assert.equal(body.data.stock_status, "Normal");

db.prepare("DELETE FROM products WHERE name = ?").run("Default Stock Test");


});

test("POST /api/products rejects a negative min_stock", async (t) => {
const server = app.listen(0);


await new Promise((resolve) => server.once("listening", resolve));
t.after(() => new Promise((resolve) => server.close(resolve)));

const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/products`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Invalid Stock Test",
            quantity: 10,
            price: 50,
            min_stock: -1
        })
    }
);

assert.equal(response.status, 400);


});

test("GET /api/products returns the correct stock status", async (t) => {
const db = require("./test-database");


db.prepare("DELETE FROM products").run();

db.prepare(`
    INSERT INTO products (name, quantity, price, min_stock)
    VALUES (?, ?, ?, ?)
`).run("Low Stock Test", 5, 50, 5);

db.prepare(`
    INSERT INTO products (name, quantity, price, min_stock)
    VALUES (?, ?, ?, ?)
`).run("Normal Stock Test", 8, 50, 5);

const server = app.listen(0);

await new Promise((resolve) => server.once("listening", resolve));
t.after(() => new Promise((resolve) => server.close(resolve)));

const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/products`
);

assert.equal(response.status, 200);

const body = await response.json();

const lowStockProduct = body.data.find(
    (product) => product.name === "Low Stock Test"
);
const normalStockProduct = body.data.find(
    (product) => product.name === "Normal Stock Test"
);

assert.equal(lowStockProduct.stock_status, "Low Stock");
assert.equal(normalStockProduct.stock_status, "Normal");

db.prepare("DELETE FROM products WHERE name IN (?, ?)").run(
    "Low Stock Test",
    "Normal Stock Test"
);


});

test("PUT /api/products updates min_stock", async (t) => {
const db = require("./test-database");


const result = db.prepare(`
    INSERT INTO products (name, quantity, price, min_stock)
    VALUES (?, ?, ?, ?)
`).run("Update Stock Test", 12, 100, 5);

const server = app.listen(0);

await new Promise((resolve) => server.once("listening", resolve));
t.after(() => new Promise((resolve) => server.close(resolve)));

const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/products/${result.lastInsertRowid}`,
    {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Update Stock Test",
            quantity: 12,
            price: 100,
            min_stock: 15
        })
    }
);

assert.equal(response.status, 200);

const body = await response.json();

assert.equal(body.data.min_stock, 15);
assert.equal(body.data.stock_status, "Low Stock");

db.prepare("DELETE FROM products WHERE id = ?").run(
    result.lastInsertRowid
);


});
