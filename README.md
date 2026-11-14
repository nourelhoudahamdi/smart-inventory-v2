# Smart Inventory Management System

A full-stack inventory management application built with Node.js, Express.js, SQLite, and vanilla JavaScript.

Smart Inventory V2 helps businesses manage products, suppliers, sales, and stock movements while providing analytics to support better business decisions.

## Features

### 1. Product Management
- Add, update, and manage products.
- Track product quantities.
- Define minimum stock levels.
- Manage purchase and selling prices.
- Associate products with suppliers.
- Activate or deactivate products.

### 2. Supplier Management
- Manage supplier information.
- Store contact details.
- Associate suppliers with products.

### 3. Sales Management
- Record product sales.
- Automatically update inventory quantities.
- Store sales history.
- Track revenue and costs.

### 4. Stock Movement Tracking
- Record stock entries (IN) and exits (OUT).
- Track movement quantities and reasons.
- Monitor stock movement trends.
- Identify the most active products.

### 5. Profit Analytics
- Calculate total revenue and costs.
- Monitor gross profit and profit margin.
- Analyze product profitability.
- Track profit trends.

### 6. Sales Performance Analytics
- Monitor total sales and revenue.
- Track quantities sold.
- Calculate average sale value.
- Identify best-selling products.
- Analyze sales trends.

### 7. Inventory Performance Analytics
- Monitor total products and stock quantities.
- Calculate total inventory value.
- Identify low-stock and out-of-stock products.
- Detect slow-moving products.

### 8. Business Insights
- Visualize stock health.
- Identify products with no recent sales.
- Highlight best-selling products.
- Monitor total stock value.

## Technologies

**Backend**
- Node.js
- Express.js
- SQLite
- better-sqlite3

**Frontend**
- HTML5
- CSS3
- JavaScript

**Development Tools**
- Visual Studio Code
- Git
- GitHub
- PowerShell

## Project Structure

```text
smart-inventory-v2/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   └── server.js
│
├── database/
│   ├── database.js
│   ├── inventory.db
│   └── seed.js
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── tests/
│   ├── api.test.js
│   └── test-database.js
│
├── .gitignore
├── package.json
└── README.md
```

## Installation and Setup

### Prerequisites

Make sure you have installed:
- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/nourelhoudahamdi/smart-inventory-v2.git
```

### 2. Navigate to the project directory

```bash
cd smart-inventory-v2
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the application

```bash
node backend/server.js
```

The server runs at:

```text
http://localhost:3000
```

Open this address in your browser to access the application.

### 5. Check API status

Visit:

```text
http://localhost:3000/api/health
```

A successful response confirms that the API is running.

## API Overview

The application provides REST API endpoints for:

| API Prefix | Description |
|---|---|
| `/api/products` | Product management |
| `/api/suppliers` | Supplier management |
| `/api/sales` | Sales operations |
| `/api/analytics` | Stock movement analytics |
| `/api/profit` | Profit analytics |
| `/api/sales-analytics` | Sales performance analytics |
| `/api/inventory-performance` | Inventory performance and business insights |

Some analytics endpoints include:

- `GET /api/analytics/stock-movements`
- `GET /api/analytics/stock-movement-trends`
- `GET /api/analytics/top-active-products`
- `GET /api/profit/summary`
- `GET /api/profit/products`
- `GET /api/profit/trends`
- `GET /api/sales-analytics/summary`
- `GET /api/sales-analytics/trends`
- `GET /api/sales-analytics/top-products`
- `GET /api/inventory-performance/summary`
- `GET /api/inventory-performance/alerts`
- `GET /api/inventory-performance/slow-moving`

## Database

The application uses SQLite through `better-sqlite3`.

The database is located at:

```text
database/inventory.db
```

Database initialization includes:
- Creating the required tables.
- Enabling foreign key constraints.
- Applying schema migrations when required.
- Maintaining product, supplier, sales, and stock movement records.

A separate database can be specified for automated tests using the `DB_PATH` environment variable.

## Running Tests

Run the automated test suite with:

```bash
npm test
```

## Project Goals

This project was developed to strengthen practical skills in:

- Backend development and REST API design.
- Database design and SQL.
- Inventory and sales management.
- Data analysis and business intelligence.
- Building full-stack applications.
- Version control with Git and GitHub.

## Future Improvements

- Add user authentication and role-based access control.
- Improve reporting and data visualization.
- Add automated report exports.
- Deploy the application to a cloud platform.
- Expand business intelligence capabilities.

---

**Author:** Nour El Houda Hamdi

**Repository:** [Smart Inventory V2](https://github.com/nourelhoudahamdi/smart-inventory-v2)