const API_URL = "http://localhost:3000/api/products";

// Store the products fetched from the API.
let allProducts = [];

// Get the HTML elements used by search and filtering.
const searchInput = document.getElementById("search-product");
const stockFilter = document.getElementById("filter-stock-status");
const resetFiltersButton = document.getElementById("reset-filters");

// Get dashboard elements.
const totalProductsElement = document.getElementById("total-products");
const totalQuantityElement = document.getElementById("total-quantity");
const inventoryValueElement = document.getElementById("inventory-value");
const lowStockCountElement = document.getElementById("low-stock-count");

// Load dashboard statistics from the API.
async function loadDashboard() {
    try {
        const response = await fetch(API_URL);

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
                total +
                Number(product.quantity) * Number(product.price),
            0
        );

        const lowStockCount = products.filter(
            (product) =>
                Number(product.quantity) <= Number(product.min_stock)
        ).length;

        totalProductsElement.textContent =
            totalProducts.toLocaleString("en-US");

        totalQuantityElement.textContent =
            totalQuantity.toLocaleString("en-US");

        inventoryValueElement.textContent =
            inventoryValue.toLocaleString("en-US", {
                maximumFractionDigits: 2
            }) + " MAD";

        lowStockCountElement.textContent =
            lowStockCount.toLocaleString("en-US");

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

// Load all products from the API.
async function loadProducts() {
    const tableBody = document.getElementById("products-table-body");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const result = await response.json();

        allProducts = result.data;
        renderProducts();

    } catch (error) {
        console.error("Error loading products:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    Could not load products. Please check that the server is running.
                </td>
            </tr>
        `;
    }
}

// Display products according to the search and stock filter.
function renderProducts() {
    const tableBody = document.getElementById("products-table-body");

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = stockFilter.value;

    const filteredProducts = allProducts.filter((product) => {
        const matchesName = String(product.name)
            .toLowerCase()
            .includes(searchText);

        const stockStatus = product.stock_status ||
            (
                Number(product.quantity) <= Number(product.min_stock)
                    ? "Low Stock"
                    : "Normal"
            );

        const matchesStatus =
            selectedStatus === "all" ||
            stockStatus === selectedStatus;

        return matchesName && matchesStatus;
    });

    tableBody.innerHTML = "";

    if (filteredProducts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">No matching products found.</td>
            </tr>
        `;
        return;
    }

    filteredProducts.forEach((product) => {
        const row = document.createElement("tr");

        const stockStatus = product.stock_status ||
            (
                Number(product.quantity) <= Number(product.min_stock)
                    ? "Low Stock"
                    : "Normal"
            );

        const statusClass =
            stockStatus === "Low Stock" ? "low-stock" : "normal-stock";

        row.innerHTML = `
            <td>${product.id}</td>
            <td></td>
            <td>${product.quantity}</td>
            <td>${product.min_stock}</td>
            <td>${Number(product.price).toLocaleString("en-US")} MAD</td>
            <td>
                <span class="stock-badge ${statusClass}">
                    ${stockStatus}
                </span>
            </td>
            <td></td>
            <td>
                <button
                    type="button"
                    class="edit-button"
                    data-id="${product.id}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-button"
                    data-id="${product.id}"
                >
                    Delete
                </button>
            </td>
        `;

        // Insert text safely into the product table.
        row.cells[1].textContent = product.name;
        row.cells[6].textContent = product.created_at || "";

        tableBody.appendChild(row);
    });
}

// Search products by name.
searchInput.addEventListener("input", () => {
    renderProducts();
});

// Filter products by stock status.
stockFilter.addEventListener("change", () => {
    renderProducts();
});

// Reset search and filter controls.
resetFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    stockFilter.value = "all";
    renderProducts();
});

// Load the products and dashboard when the page opens.
async function initializeDashboard() {
    await Promise.all([
        loadProducts(),
        loadDashboard()
    ]);
}

initializeDashboard();

// Handle Add Product form submissions.
const addProductForm = document.getElementById("add-product-form");
const formMessage = document.getElementById("form-message");

addProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("product-name").value.trim();
    const quantityInput =
        document.getElementById("product-quantity").value;
    const priceInput =
        document.getElementById("product-price").value;
    const minStockInput =
        document.getElementById("product-min-stock").value;

    const quantity = Number(quantityInput);
    const price = Number(priceInput);
    const min_stock = Number(minStockInput);

    if (
        !name ||
        quantityInput.trim() === "" ||
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        priceInput.trim() === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        minStockInput.trim() === "" ||
        !Number.isInteger(min_stock) ||
        min_stock < 0
    ) {
        formMessage.textContent =
            "Please enter valid product information.";
        formMessage.style.color = "#dc2626";
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                quantity,
                price,
                min_stock
            })
        });

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
        document.getElementById("product-min-stock").value = "5";

        await Promise.all([
            loadProducts(),
            loadDashboard()
        ]);

    } catch (error) {
        console.error("Error adding product:", error);

        formMessage.textContent =
            "Could not connect to the server. Check that it is running.";
        formMessage.style.color = "#dc2626";
    }
});

// Handle Edit button clicks.
document
    .getElementById("products-table-body")
    .addEventListener("click", async (event) => {
        const button = event.target.closest(".edit-button");

        if (!button) return;

        const productId = button.dataset.id;

        try {
            const response = await fetch(API_URL);

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

            const name = prompt(
                "Enter the new product name:",
                product.name
            );

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

            const minStockInput = prompt(
                "Enter the minimum stock:",
                product.min_stock
            );

            if (minStockInput === null) return;

            const quantity = Number(quantityInput);
            const price = Number(priceInput);
            const min_stock = Number(minStockInput);

            if (
                !name.trim() ||
                quantityInput.trim() === "" ||
                !Number.isInteger(quantity) ||
                quantity < 0 ||
                priceInput.trim() === "" ||
                !Number.isFinite(price) ||
                price < 0 ||
                minStockInput.trim() === "" ||
                !Number.isInteger(min_stock) ||
                min_stock < 0
            ) {
                alert("Please enter valid product information.");
                return;
            }

            const updateResponse = await fetch(
                `${API_URL}/${productId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        quantity,
                        price,
                        min_stock
                    })
                }
            );

            const updateResult = await updateResponse.json();

            if (!updateResponse.ok) {
                alert(
                    updateResult.message || "Could not update product."
                );
                return;
            }

            alert("Product updated successfully!");

            await Promise.all([
                loadProducts(),
                loadDashboard()
            ]);

        } catch (error) {
            console.error("Error updating product:", error);
            alert("Could not connect to the server.");
        }
    });

// Handle Delete button clicks.
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
                `${API_URL}/${productId}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                alert(
                    result.message || "Could not delete product."
                );
                return;
            }

            alert("Product deleted successfully!");

            await Promise.all([
                loadProducts(),
                loadDashboard()
            ]);

        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Could not connect to the server.");
        }
    });
