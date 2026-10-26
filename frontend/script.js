// Update Dashboard statistics using real product data
async function loadDashboard() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/products"
        );

        if (!response.ok) {
            throw new Error("Failed to load dashboard data");
        }

        const result = await response.json();
        const products = result.data;

        const totalProducts = products.length;

        const totalQuantity = products.reduce(
            (total, product) => total + Number(product.quantity),
            0
        );

        const inventoryValue = products.reduce(
            (total, product) =>
                total + Number(product.quantity) * Number(product.price),
            0
        );

        document.getElementById("total-products").textContent =
            totalProducts.toLocaleString("en-US");

        document.getElementById("total-quantity").textContent =
            totalQuantity.toLocaleString("en-US");

        document.getElementById("inventory-value").textContent =
            inventoryValue.toLocaleString("en-US", {
                maximumFractionDigits: 2
            }) + " MAD";

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}
// Load products from the backend API
async function loadProducts() {
    const tableBody = document.getElementById("products-table-body");

    try {
        const response = await fetch("http://localhost:3000/api/products");

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const result = await response.json();

        // Clear the loading message
        tableBody.innerHTML = "";

        // Display a message if there are no products
        if (result.data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No products found.</td>
                </tr>
            `;
            return;
        }

        // Display each product in the table
        result.data.forEach((product) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${Number(product.price).toLocaleString("en-US")} MAD</td>
                <td>${product.created_at}</td>
                <td>
                    <button type="button" class="edit-button" data-id="${product.id}">
                        Edit
                    </button>

                    <button type="button" class="delete-button" data-id="${product.id}">
                        Delete
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading products:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Could not load products. Please check that the server is running.
                </td>
            </tr>
        `;
    }
}

// Load products when the page opens
loadProducts();
loadDashboard();

// Handle the Add Product form
const addProductForm = document.getElementById("add-product-form");
const formMessage = document.getElementById("form-message");

addProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("product-name").value.trim();
    const quantity = Number(
        document.getElementById("product-quantity").value
    );
    const price = Number(
        document.getElementById("product-price").value
    );

    if (!name || !Number.isInteger(quantity) || quantity < 0 ||
        !Number.isFinite(price) || price < 0) {
        formMessage.textContent = "Please enter valid product information.";
        formMessage.style.color = "#dc2626";
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:3000/api/products",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    quantity: quantity,
                    price: price
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            formMessage.textContent =
                result.message || "Could not add product.";
            formMessage.style.color = "#dc2626";
            return;
        }

        formMessage.textContent = "Product added successfully!";
        formMessage.style.color = "#16a34a";

        addProductForm.reset();

        await loadProducts();
        await loadDashboard();

    } catch (error) {
        console.error("Error adding product:", error);

        formMessage.textContent =
            "Could not connect to the server. Check that it is running.";
        formMessage.style.color = "#dc2626";
    }
});

// Handle Edit button clicks
document
    .getElementById("products-table-body")
    .addEventListener("click", async (event) => {
        const button = event.target.closest(".edit-button");

        if (!button) return;

        const productId = button.dataset.id;

        const response = await fetch(
            `http://localhost:3000/api/products`
        );

        if (!response.ok) {
            alert("Could not load products.");
            return;
        }

        const result = await response.json();

        const product = result.data.find(
            (item) => String(item.id) === productId
        );

        if (!product) {
            alert("Product not found.");
            return;
        }

        const name = prompt("Enter the new product name:", product.name);

        if (name === null) return;

        const quantityInput = prompt(
            "Enter the new quantity:",
            product.quantity
        );

        if (quantityInput === null) return;

        const priceInput = prompt(
            "Enter the new price (MAD):",
            product.price
        );

        if (priceInput === null) return;

        const quantity = Number(quantityInput);
        const price = Number(priceInput);

        if (
            !name.trim() ||
            quantityInput.trim() === "" ||
            !Number.isInteger(quantity) ||
            quantity < 0 ||
            priceInput.trim() === "" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            alert("Please enter valid product information.");
            return;
        }

        try {
            const updateResponse = await fetch(
                `http://localhost:3000/api/products/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        quantity,
                        price
                    })
                }
            );

            const updateResult = await updateResponse.json();

            if (!updateResponse.ok) {
                alert(updateResult.message || "Could not update product.");
                return;
            }

            alert("Product updated successfully!");

            await loadProducts();
            await loadDashboard();

        } catch (error) {
            console.error("Error updating product:", error);
            alert("Could not connect to the server.");
        }
    });

// Handle Delete button clicks
document
    .getElementById("products-table-body")
    .addEventListener("click", async (event) => {
        const button = event.target.closest(".delete-button");

        if (!button) return;

        const productId = button.dataset.id;

        const confirmed = confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `http://localhost:3000/api/products/${productId}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Could not delete product.");
                return;
            }

            alert("Product deleted successfully!");

            await loadProducts();
            await loadDashboard();

        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Could not connect to the server.");
        }
    });