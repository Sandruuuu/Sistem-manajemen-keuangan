class TransactionService {
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }

    async createTransaction(data) {
        const { accountName, amount, type, category, note, date } = data;

        // Validate input data
        if (!accountName || !amount || !type || !category || !date) {
            throw new Error('All fields are required');
        }

        const transaction = {
            accountName,
            amount,
            type,
            category,
            note,
            date,
        };

        return await this.transactionModel.create(transaction);
    }

    async getTransactions(accountName) {
        return await this.transactionModel.find({ accountName });
    }

    async updateTransaction(id, data) {
        return await this.transactionModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteTransaction(id) {
        return await this.transactionModel.findByIdAndDelete(id);
    }
}

module.exports = TransactionService;