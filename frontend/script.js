
const API_URL = "http://localhost:3000/api/products";
const SUPPLIERS_API_URL = "http://localhost:3000/api/suppliers";

let allProducts = [];
let allSuppliers = [];
let editingSupplierId = null;

// ------------------------------
// DOM ELEMENTS
// ------------------------------

const searchInput = document.getElementById("search-product");
const stockFilter = document.getElementById("filter-stock-status");
const resetFiltersButton = document.getElementById("reset-filters");

const totalProductsElement = document.getElementById("total-products");
const totalQuantityElement = document.getElementById("total-quantity");
const inventoryValueElement = document.getElementById("inventory-value");
const lowStockCountElement = document.getElementById("low-stock-count");

const productsTableBody = document.getElementById("products-table-body");

const addProductForm = document.getElementById("add-product-form");
const formMessage = document.getElementById("form-message");
const productSupplierSelect = document.getElementById("product-supplier");

const supplierForm = document.getElementById("supplier-form");
const supplierMessage = document.getElementById("supplier-message");
const suppliersTableBody = document.getElementById("suppliers-table-body");


// ------------------------------
// HELPER: SHOW MESSAGE
// ------------------------------

function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "#16a34a" : "#dc2626";
}


// ------------------------------
// DASHBOARD
// ------------------------------

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
                total + Number(product.quantity) * Number(product.price),
            0
        );

        const lowStockCount = products.filter(
            product =>
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


// ------------------------------
// SUPPLIERS: LOAD
// ------------------------------

async function loadSuppliers() {
    try {
        const response = await fetch(SUPPLIERS_API_URL);

        if (!response.ok) {
            throw new Error("Failed to load suppliers");
        }

        const result = await response.json();
        allSuppliers = result.data;

        renderSuppliers();
        renderSupplierOptions();

    } catch (error) {
        console.error("Error loading suppliers:", error);

        if (suppliersTableBody) {
            suppliersTableBody.textContent = "";
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;
            cell.textContent = "Could not load suppliers. Check the server.";

            row.appendChild(cell);
            suppliersTableBody.appendChild(row);
        }
    }
}


// ------------------------------
// SUPPLIERS: DROPDOWN
// ------------------------------

function renderSupplierOptions() {
    if (!productSupplierSelect) return;

    productSupplierSelect.textContent = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "No Supplier";

    productSupplierSelect.appendChild(defaultOption);

    allSuppliers.forEach(supplier => {
        const option = document.createElement("option");

        option.value = supplier.id;
        option.textContent = supplier.name;

        productSupplierSelect.appendChild(option);
    });
}


// ------------------------------
// SUPPLIERS: DISPLAY TABLE
// ------------------------------

function renderSuppliers() {
    if (!suppliersTableBody) return;

    suppliersTableBody.textContent = "";

    if (allSuppliers.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No suppliers found.";

        row.appendChild(cell);
        suppliersTableBody.appendChild(row);
        return;
    }

    allSuppliers.forEach(supplier => {
        const row = document.createElement("tr");

        const values = [
            supplier.id,
            supplier.name,
            supplier.phone || "-",
            supplier.email || "-",
            supplier.address || "-",
            supplier.products_count ?? 0
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            row.appendChild(cell);
        });

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "supplier-edit-button";
        editButton.dataset.id = supplier.id;
        editButton.textContent = "Edit";

        const archiveButton = document.createElement("button");
        archiveButton.type = "button";
        archiveButton.className = "supplier-archive-button";
        archiveButton.dataset.id = supplier.id;
        archiveButton.textContent = "Archive";

        actionsCell.append(editButton, archiveButton);
        row.appendChild(actionsCell);

        suppliersTableBody.appendChild(row);
    });
}


// ------------------------------
// SUPPLIERS: RESET FORM
// ------------------------------

function resetSupplierForm() {
    if (!supplierForm) return;

    supplierForm.reset();
    editingSupplierId = null;

    document.getElementById("supplier-form-title").textContent =
        "Add Supplier";

    document.getElementById("supplier-submit-button").textContent =
        "Add Supplier";

    document.getElementById("cancel-supplier-edit").hidden = true;
}


// ------------------------------
// SUPPLIERS: ADD / UPDATE
// ------------------------------

if (supplierForm) {
    supplierForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("supplier-name").value.trim();
        const phone = document.getElementById("supplier-phone").value.trim();
        const email = document.getElementById("supplier-email").value.trim();
        const address = document.getElementById("supplier-address").value.trim();

        if (!name) {
            showMessage(supplierMessage, "Supplier name is required.");
            return;
        }

        const supplierData = {
            name,
            phone,
            email,
            address
        };

        const isEditing = editingSupplierId !== null;

        const url = isEditing
            ? `${SUPPLIERS_API_URL}/${editingSupplierId}`
            : SUPPLIERS_API_URL;

        try {
            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(supplierData)
            });

            const result = await response.json();

            if (!response.ok) {
                showMessage(
                    supplierMessage,
                    result.message || "Could not save supplier."
                );
                return;
            }

            showMessage(
                supplierMessage,
                isEditing
                    ? "Supplier updated successfully!"
                    : "Supplier added successfully!",
                true
            );

            resetSupplierForm();

            await Promise.all([
                loadSuppliers(),
                loadProducts()
            ]);

        } catch (error) {
            console.error("Supplier save error:", error);
            showMessage(supplierMessage, "Could not connect to the server.");
        }
    });
}


// ------------------------------
// SUPPLIERS: CANCEL EDIT
// ------------------------------

const cancelSupplierEditButton =
    document.getElementById("cancel-supplier-edit");

if (cancelSupplierEditButton) {
    cancelSupplierEditButton.addEventListener("click", () => {
        resetSupplierForm();
        supplierMessage.textContent = "";
    });
}


// ------------------------------
// SUPPLIERS: EDIT / ARCHIVE
// ------------------------------

if (suppliersTableBody) {
    suppliersTableBody.addEventListener("click", async event => {
        const button = event.target.closest(
            ".supplier-edit-button, .supplier-archive-button"
        );

        if (!button) return;

        const supplierId = Number(button.dataset.id);

        const supplier = allSuppliers.find(
            item => Number(item.id) === supplierId
        );

        if (!supplier) {
            alert("Supplier not found.");
            return;
        }

        // EDIT SUPPLIER
        if (button.classList.contains("supplier-edit-button")) {
            editingSupplierId = supplierId;

            document.getElementById("supplier-name").value =
                supplier.name || "";

            document.getElementById("supplier-phone").value =
                supplier.phone || "";

            document.getElementById("supplier-email").value =
                supplier.email || "";

            document.getElementById("supplier-address").value =
                supplier.address || "";

            document.getElementById("supplier-form-title").textContent =
                "Edit Supplier";

            document.getElementById("supplier-submit-button").textContent =
                "Save Changes";

            cancelSupplierEditButton.hidden = false;

            supplierForm.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return;
        }

        // ARCHIVE SUPPLIER
        if (button.classList.contains("supplier-archive-button")) {
            const confirmed = confirm(
                `Are you sure you want to archive ${supplier.name}?`
            );

            if (!confirmed) return;

            try {
                const response = await fetch(
                    `${SUPPLIERS_API_URL}/${supplierId}`,
                    { method: "DELETE" }
                );

                const result = await response.json();

                if (!response.ok) {
                    alert(result.message || "Could not archive supplier.");
                    return;
                }

                alert("Supplier archived successfully!");

                if (editingSupplierId === supplierId) {
                    resetSupplierForm();
                }

                await Promise.all([
                    loadSuppliers(),
                    loadProducts()
                ]);

            } catch (error) {
                console.error("Supplier archive error:", error);
                alert("Could not connect to the server.");
            }
        }
    });
}


// ------------------------------
// PRODUCTS: LOAD
// ------------------------------

async function loadProducts() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const result = await response.json();

        allProducts = result.data;
        renderProducts();
        renderReorderSuggestions();

    } catch (error) {
        console.error("Error loading products:", error);

        productsTableBody.textContent = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 9;
        cell.textContent =
            "Could not load products. Please check that the server is running.";

        row.appendChild(cell);
        productsTableBody.appendChild(row);
    }
}


// ------------------------------
// PRODUCTS: DISPLAY TABLE
// ------------------------------

function renderProducts() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = stockFilter.value;

    const filteredProducts = allProducts.filter(product => {
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

    productsTableBody.textContent = "";

    if (filteredProducts.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 9;
        cell.textContent = "No matching products found.";

        row.appendChild(cell);
        productsTableBody.appendChild(row);
        return;
    }

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        const stockStatus = product.stock_status ||
            (
                Number(product.quantity) <= Number(product.min_stock)
                    ? "Low Stock"
                    : "Normal"
            );

        const statusClass =
            stockStatus === "Low Stock" ? "low-stock" : "normal-stock";

        const basicValues = [
            product.id,
            product.name,
            product.quantity,
            product.min_stock,
            Number(product.price).toLocaleString("en-US") + " MAD",
            product.supplier_name || "No Supplier"
        ];

        basicValues.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = `stock-badge ${statusClass}`;
        badge.textContent = stockStatus;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        const dateCell = document.createElement("td");
        dateCell.textContent = product.created_at || "";
        row.appendChild(dateCell);

        const actionsCell = document.createElement("td");

        const actions = [
            ["edit-button", "Edit"],
            ["delete-button", "Archive"],
            ["stock-in-button", "Stock IN"],
            ["stock-out-button", "Stock OUT"],
            ["history-button", "History"]
        ];

        actions.forEach(([className, label]) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = className;
            button.dataset.id = product.id;
            button.textContent = label;

            actionsCell.appendChild(button);
        });

        row.appendChild(actionsCell);
        productsTableBody.appendChild(row);
    });
}

// ------------------------------
// SMART REORDER SUGGESTIONS
// ------------------------------

function renderReorderSuggestions() {
    const container = document.getElementById("reorder-suggestions");

    const productsToReorder = allProducts.filter(product => {
        return Number(product.quantity) <= Number(product.min_stock);
    });

    container.textContent = "";

    if (productsToReorder.length === 0) {
        container.textContent = "No products need restocking.";
        return;
    }

    productsToReorder.forEach(product => {
        const suggestedQuantity = Math.max(
            Number(product.min_stock) - Number(product.quantity),
            0
        );

        const card = document.createElement("div");
        card.className = "reorder-card";

        const name = document.createElement("h3");
        name.textContent = product.name;

        const details = document.createElement("p");
        details.textContent =
            `Current Quantity: ${product.quantity} | Minimum Stock: ${product.min_stock}`;

        const suggestion = document.createElement("p");
        suggestion.textContent =
            suggestedQuantity === 0
                ? "At minimum stock — monitor this product."
                : `Suggested Reorder: ${suggestedQuantity} units`;

        card.appendChild(name);
        card.appendChild(details);
        card.appendChild(suggestion);

        container.appendChild(card);
    });
}

// ------------------------------
// PRODUCTS: SEARCH / FILTER
// ------------------------------

searchInput.addEventListener("input", renderProducts);
stockFilter.addEventListener("change", renderProducts);

resetFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    stockFilter.value = "all";
    renderProducts();
});


// ------------------------------
// PRODUCTS: ADD
// ------------------------------

addProductForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("product-name").value.trim();

    const quantityInput =
        document.getElementById("product-quantity").value;

    const priceInput =
        document.getElementById("product-price").value;

    const minStockInput =
        document.getElementById("product-min-stock").value;

    const supplierInput = productSupplierSelect.value;

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
        showMessage(formMessage, "Please enter valid product information.");
        return;
    }

    const supplier_id = supplierInput === ""
        ? null
        : Number(supplierInput);

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
                min_stock,
                supplier_id
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(
                formMessage,
                result.message || "Could not add product."
            );
            return;
        }

        showMessage(formMessage, "Product added successfully!", true);

        addProductForm.reset();
        document.getElementById("product-min-stock").value = "5";

        await Promise.all([
            loadProducts(),
            loadDashboard()
        ]);

    } catch (error) {
        console.error("Error adding product:", error);
        showMessage(
            formMessage,
            "Could not connect to the server. Check that it is running."
        );
    }
});


// ------------------------------
// PRODUCTS: ACTIONS
// ------------------------------

productsTableBody.addEventListener("click", async event => {
    const button = event.target.closest(
        ".edit-button, .delete-button, .stock-in-button, .stock-out-button, .history-button"
    );

    if (!button) return;

    const productId = button.dataset.id;

    // EDIT PRODUCT
    if (button.classList.contains("edit-button")) {
        const product = allProducts.find(
            item => String(item.id) === productId
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

        const minStockInput = prompt(
            "Enter the minimum stock:",
            product.min_stock
        );
        if (minStockInput === null) return;

        const currentSupplierId = product.supplier_id ?? "";

        const supplierChoices = [
            "Leave blank for No Supplier",
            ...allSuppliers.map(
                supplier => `${supplier.id} = ${supplier.name}`
            )
        ].join("\n");

        const supplierInput = prompt(
            `Enter the Supplier ID:\n${supplierChoices}`,
            String(currentSupplierId)
        );

        if (supplierInput === null) return;

        const quantity = Number(quantityInput);
        const price = Number(priceInput);
        const min_stock = Number(minStockInput);

        let supplier_id = null;

        if (supplierInput.trim() !== "") {
            supplier_id = Number(supplierInput);

            const supplierExists = allSuppliers.some(
                supplier => Number(supplier.id) === supplier_id
            );

            if (!Number.isInteger(supplier_id) || !supplierExists) {
                alert("Please enter a valid active Supplier ID.");
                return;
            }
        }

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

        try {
            const response = await fetch(`${API_URL}/${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    quantity,
                    price,
                    min_stock,
                    supplier_id
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Could not update product.");
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

        return;
    }


    // ARCHIVE PRODUCT
    if (button.classList.contains("delete-button")) {
        const confirmed = confirm(
            "Are you sure you want to archive this product?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${API_URL}/${productId}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Could not archive product.");
                return;
            }

            alert("Product archived successfully!");

            await Promise.all([
                loadProducts(),
                loadDashboard()
            ]);

        } catch (error) {
            console.error("Error archiving product:", error);
            alert("Could not connect to the server.");
        }

        return;
    }


    // STOCK IN / STOCK OUT
    if (
        button.classList.contains("stock-in-button") ||
        button.classList.contains("stock-out-button")
    ) {
        const movementType =
            button.classList.contains("stock-in-button") ? "IN" : "OUT";

        const quantityInput = prompt("Enter the quantity:");
        if (quantityInput === null) return;

        const quantity = Number(quantityInput);

        if (
            quantityInput.trim() === "" ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            alert("Please enter a valid positive integer.");
            return;
        }

        const reason = prompt("Enter the reason for this movement:");

        if (reason === null || !reason.trim()) {
            alert("A reason is required.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/${productId}/movements`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        movement_type: movementType,
                        quantity,
                        reason: reason.trim()
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Movement failed.");
                return;
            }

            alert(result.message);

            await Promise.all([
                loadProducts(),
                loadDashboard()
            ]);

        } catch (error) {
            console.error("Stock movement error:", error);
            alert("Could not connect to the server.");
        }

        return;
    }


    // MOVEMENT HISTORY
    if (button.classList.contains("history-button")) {
        try {
            const response = await fetch(
                `${API_URL}/${productId}/movements`
            );

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Could not retrieve history.");
                return;
            }

            if (result.data.length === 0) {
                alert("No stock movements found for this product.");
                return;
            }

            const history = result.data.map(movement =>
                `${movement.movement_type}` +
                ` | Quantity: ${movement.quantity}` +
                ` | Reason: ${movement.reason}` +
                ` | Date: ${movement.created_at}`
            ).join("\n\n");

            alert("STOCK MOVEMENT HISTORY\n\n" + history);

        } catch (error) {
            console.error("History error:", error);
            alert("Could not connect to the server.");
        }
    }
});


// ------------------------------
// INITIALIZE APPLICATION
// ------------------------------

async function initializeDashboard() {
    await Promise.all([
        loadSuppliers(),
        loadProducts(),
        loadDashboard()
    ]);
}

initializeDashboard();
