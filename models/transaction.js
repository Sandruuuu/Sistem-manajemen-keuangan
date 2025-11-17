class Transaction {
    constructor(accountName, amount, type, category, note, date) {
        this.accountName = accountName; // User profile
        this.amount = amount; // Income/expenses amount
        this.type = type; // Income or Expense
        this.category = category; // Debit, Card, E-wallet
        this.note = note; // Transaction details
        this.date = date; // Transaction occurrence date
    }
}

module.exports = Transaction;