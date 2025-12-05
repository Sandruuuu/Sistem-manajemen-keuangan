# Project Sistem-manajemen-keuangan

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
