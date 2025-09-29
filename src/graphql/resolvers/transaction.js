const Transaction = require("../../models/Transaction");
const Account = require("../../models/Accounts");
const TransactionService = require("../../services/transactionService");
const { requireAuth } = require("../../middleware/auth");

const transactionResolvers = {
  Query: {
    transactions: async (parent, { filter = {} }, context) => {
      const user = requireAuth(context.user);

      const filters = { ...filter };
      if (filters.type) {
        filters.type = filters.type.toLowerCase();
      }

      const transactions = await TransactionService.getTransactions(user.id, filters);

      return transactions.map((transaction) => transaction.toJSON());
    },

    transaction: async (parent, { id }, context) => {
      const user = requireAuth(context.user);

      const transaction = await Transaction.findByIdAndUserId(id, user.id);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      return transaction.toJSON();
    },

    recentTransactions: async (parent, { limit = 10 }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.getRecentTransactions(user.id, limit);

      return transactions.map((transaction) => transaction.toJSON());
    },

    transactionsByDateRange: async (parent, { startDate, endDate }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.getTransactionsByDateRange(user.id, startDate, endDate);

      return transactions.map((transaction) => transaction.toJSON());
    },

    accountTransactions: async (parent, { accountId, limit = 50 }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.getAccountTransactions(user.id, accountId, limit);

      return transactions.map((transaction) => transaction.toJSON());
    },

    categoryTransactions: async (parent, { categoryId, limit = 50 }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.getCategoryTransactions(user.id, categoryId, limit);
      
      return transactions.map((transaction) => transaction.toJSON());
    },

    searchTransactions: async (parent, { query, limit = 20 }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.searchTransactions(user.id, query, limit);
      
      return transactions.map((transaction) => transaction.toJSON());
    },

    transactionStats: async (parent, { startDate, endDate }, context) => {
      const user = requireAuth(context.user);

      const stats = await Transaction.getTransactionStats(user.id, { startDate, endDate });
      
      return stats.map((stat) => ({
        ...stat,
        type: stat.type.toUpperCase(),
      }));
    },

    monthlyTransactionSummary: async (parent, { year, month }, context) => {
      const user = requireAuth(context.user);

      const summary = await TransactionService.getMonthlyTransactionSummary(user.id, year, month);

      return {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        netIncome: summary.netIncome,
        transactionCount: summary.transactionCount,
        expensesByCategory: Object.entries(summary.expensesByCategory).map(([name, data]) => ({
          name,
          amount: data.amount,
          count: data.count,
          color: data.color,
        })),
        incomeByCategory: Object.entries(summary.incomeByCategory).map(([name, data]) => ({
          name,
          amount: data.amount,
          count: data.count,
          color: data.color,
        })),
        transactionsByAccount: Object.entries(summary.transactionsByAccount).map(([name, data]) => ({
          name,
          income: data.income,
          expenses: data.expenses,
          count: data.count,
          color: data.color,
        })),
      };
    },

    spendingTrends: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const trends = await TransactionService.getSpendingTrends(user.id);
      return trends;
    },

    expenseTransactions: async (parent, { limit = 20 }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.getTransactions(user.id, {
        type: "expense",
        limit,
        orderBy: "transaction_date",
        orderDirection: "DESC",
      });
      return transactions.map((transaction) => transaction.toJSON());
    },

    incomeTransactions: async (parent, { limit = 20 }, context) => {
      const user = requireAuth(context.user);

      const transactions = await TransactionService.getTransactions(user.id, {
        type: "income",
        limit,
        orderBy: "transaction_date",
        orderDirection: "DESC",
      });
      return transactions.map((transaction) => transaction.toJSON());
    },
  },

  Mutation: {
    createTransaction: async (parent, { input }, context) => {
      try {
        const user = requireAuth(context.user);

        TransactionService.validateTransactionInput(input);

        const transactionData = {
          ...input,
          type: input.type.toLowerCase(),
        };

        const transaction = await TransactionService.createTransaction(user.id, transactionData);
        return transaction.toJSON();
      } catch (error) {
        throw new Error(`Failed to create transaction: ${error.message}`);
      }
    },

    updateTransaction: async (parent, { id, input }, context) => {
      try {
        const user = requireAuth(context.user);

        const transaction = await Transaction.findByIdAndUserId(id, user.id);
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        if (input.description !== undefined || input.amount !== undefined || input.type !== undefined) {
          const validationInput = {
            description: input.description || transaction.description,
            amount: input.amount || transaction.amount,
            type: input.type ? input.type.toLowerCase() : transaction.type,
            accountId: input.accountId || transaction.accountId,
            categoryId: input.categoryId || transaction.categoryId,
          };
          TransactionService.validateTransactionInput(validationInput);
        }

        const updateData = { ...input };
        if (updateData.type) {
          updateData.type = updateData.type.toLowerCase();
        }

        await transaction.update(updateData);

        const updatedTransaction = await Transaction.findByIdAndUserId(transaction.id, user.id);
        return updatedTransaction.toJSON();
      } catch (error) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
    },

    deleteTransaction: async (parent, { id }, context) => {
      try {
        const user = requireAuth(context.user);

        const transaction = await Transaction.findByIdAndUserId(id, user.id);
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        await transaction.delete();
        return true;
      } catch (error) {
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }
    },

    createQuickExpense: async (parent, { amount, description, categoryId, accountId }, context) => {
      try {
        const user = requireAuth(context.user);

        let finalAccountId = accountId;
        if (!finalAccountId) {
          const defaultAccount = await Account.findDefaultByUserId(user.id);
          if (!defaultAccount) {
            throw new Error("No default account found. Please specify an account.");
          }
          finalAccountId = defaultAccount.id;
        }

        const transactionData = {
          accountId: finalAccountId,
          categoryId,
          type: "expense",
          amount,
          description,
          transactionDate: new Date().toISOString().split("T")[0],
        };

        TransactionService.validateTransactionInput(transactionData);

        const transaction = await TransactionService.createTransaction(user.id, transactionData);
        return transaction.toJSON();
      } catch (error) {
        throw new Error(`Failed to create quick expense: ${error.message}`);
      }
    },

    createQuickIncome: async (parent, { amount, description, categoryId, accountId }, context) => {
      try {
        const user = requireAuth(context.user);

        let finalAccountId = accountId;
        if (!finalAccountId) {
          const defaultAccount = await Account.findDefaultByUserId(user.id);
          if (!defaultAccount) {
            throw new Error("No default account found. Please specify an account.");
          }
          finalAccountId = defaultAccount.id;
        }

        const transactionData = {
          accountId: finalAccountId,
          categoryId,
          type: "income",
          amount,
          description,
          transactionDate: new Date().toISOString().split("T")[0],
        };

        TransactionService.validateTransactionInput(transactionData);

        const transaction = await TransactionService.createTransaction(user.id, transactionData);
        return transaction.toJSON();
      } catch (error) {
        throw new Error(`Failed to create quick income: ${error.message}`);
      }
    },
  },

  TransactionType: {
    INCOME: "income",
    EXPENSE: "expense",
    TRANSFER: "transfer",
  },
};

module.exports = transactionResolvers;
