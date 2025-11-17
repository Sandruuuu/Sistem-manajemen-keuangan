# Sistem Keuangan Project

## Overview
Sistem Keuangan is a financial management application that allows users to track their income and expenses. The application provides features for managing transactions, including categorization and detailed notes.

## Features
- User account management
- Transaction management (income and expenses)
- Categorization of transactions (debit, card, e-wallet)
- Detailed notes for each transaction
- Date tracking for transactions

## Project Structure
```
sistem-keuangan-1
├── .env                  # Environment variables
├── app.js                # Main application file
├── server.js             # Server startup file
├── package.json          # npm configuration file
├── config
│   └── db.js            # Database connection and initialization
├── controllers
│   └── transactionsController.js  # Handles transaction-related operations
├── models
│   ├── account.js       # User account model
│   ├── transaction.js    # Transaction model
│   └── transaction_history.js  # Transaction history model
├── routes
│   ├── accounts.js      # Account management routes
│   ├── admin.js         # Admin routes
│   ├── index.js         # Entry point for all routes
│   └── transactions.js   # Transaction routes
├── services
│   └── transactionService.js  # Business logic for transactions
└── README.md            # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd sistem-keuangan-1
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables (e.g., database connection strings).
5. Start the server:
   ```
   node server.js
   ```

## Usage
- Access the API at `http://localhost:3000`.
- Use the provided routes to manage accounts and transactions.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.