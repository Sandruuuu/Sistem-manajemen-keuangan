class TransactionHistory {
    constructor(accountName, amount, type, category, note, date) {
        this.accountName = accountName;
        this.amount = amount;
        this.type = type; // income or expense
        this.category = category; // debit, card, e-wallet
        this.note = note;
        this.date = date;
    }
}

module.exports = TransactionHistory;