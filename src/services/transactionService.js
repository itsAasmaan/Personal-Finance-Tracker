const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Category = require("../models/Category");

class TransactionService {
  static async createTransaction(userId, transactionData) {
    try {
      if (!transactionData.transactionDate) {
        transactionData.transactionDate = new Date().toISOString().split("T")[0];
      }

      const transaction = await Transaction.create({
        userId,
        ...transactionData,
      });

      return await Transaction.findByIdAndUserId(transaction.id, userId);
    } catch (error) {
      throw error;
    }
  }

  static async getTransactions(userId, filters = {}) {
    try {
      const options = {
        type: filters.type,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        search: filters.search,
        orderBy: filters.orderBy || "transaction_date",
        orderDirection: filters.orderDirection || "DESC",
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      };

      return await Transaction.findByUserId(userId, options);
    } catch (error) {
      throw error;
    }
  }

  static async getRecentTransactions(userId, limit = 10) {
    try {
      return await Transaction.findByUserId(userId, {
        orderBy: "created_at",
        orderDirection: "DESC",
        limit,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getTransactionsByDateRange(userId, startDate, endDate) {
    try {
      return await Transaction.findByUserId(userId, {
        startDate,
        endDate,
        orderBy: "transaction_date",
        orderDirection: "DESC",
      });
    } catch (error) {
      throw error;
    }
  }

  static async getMonthlyTransactionSummary(userId, year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];

      const transactions = await Transaction.findByUserId(userId, {
        startDate,
        endDate,
      });

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: transactions.length,
        expensesByCategory: {},
        incomeByCategory: {},
        transactionsByAccount: {},
      };

      transactions.forEach((transaction) => {
        if (transaction.type === "income") {
          summary.totalIncome += transaction.amount;

          if (!summary.incomeByCategory[transaction.category.name]) {
            summary.incomeByCategory[transaction.category.name] = {
              amount: 0,
              count: 0,
              color: transaction.category.color,
            };
          }
          summary.incomeByCategory[transaction.category.name].amount += transaction.amount;
          summary.incomeByCategory[transaction.category.name].count += 1;
        } else if (transaction.type === "expense") {
          summary.totalExpenses += transaction.amount;

          if (!summary.expensesByCategory[transaction.category.name]) {
            summary.expensesByCategory[transaction.category.name] = {
              amount: 0,
              count: 0,
              color: transaction.category.color,
            };
          }
          summary.expensesByCategory[transaction.category.name].amount += transaction.amount;
          summary.expensesByCategory[transaction.category.name].count += 1;
        }

        if (!summary.transactionsByAccount[transaction.account.name]) {
          summary.transactionsByAccount[transaction.account.name] = {
            income: 0,
            expenses: 0,
            count: 0,
            color: transaction.account.color,
          };
        }

        if (transaction.type === "income") {
          summary.transactionsByAccount[transaction.account.name].income += transaction.amount;
        } else if (transaction.type === "expense") {
          summary.transactionsByAccount[transaction.account.name].expenses += transaction.amount;
        }
        summary.transactionsByAccount[transaction.account.name].count += 1;
      });

      summary.netIncome = summary.totalIncome - summary.totalExpenses;

      return summary;
    } catch (error) {
      throw error;
    }
  }

  static async getSpendingTrends(userId) {
    try {
      const months = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          monthName: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        });
      }

      const trends = [];

      for (const month of months) {
        const summary = await this.getMonthlyTransactionSummary(userId, month.year, month.month);
        trends.push({
          period: month.monthName,
          income: summary.totalIncome,
          expenses: summary.totalExpenses,
          netIncome: summary.netIncome,
          transactionCount: summary.transactionCount,
        });
      }

      return trends;
    } catch (error) {
      throw error;
    }
  }

  static async searchTransactions(userId, searchQuery, limit = 20) {
    try {
      return await Transaction.findByUserId(userId, {
        search: searchQuery,
        limit,
        orderBy: "transaction_date",
        orderDirection: "DESC",
      });
    } catch (error) {
      throw error;
    }
  }

  static async getAccountTransactions(userId, accountId, limit = 50) {
    try {
      return await Transaction.findByUserId(userId, {
        accountId,
        limit,
        orderBy: "transaction_date",
        orderDirection: "DESC",
      });
    } catch (error) {
      throw error;
    }
  }

  static async getCategoryTransactions(userId, categoryId, limit = 50) {
    try {
      return await Transaction.findByUserId(userId, {
        categoryId,
        limit,
        orderBy: "transaction_date",
        orderDirection: "DESC",
      });
    } catch (error) {
      throw error;
    }
  }

  static validateTransactionInput(input) {
    const errors = [];

    if (!input.description || input.description.trim().length < 2) {
      errors.push("Description must be at least 2 characters long");
    }

    if (!input.amount || input.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }

    if (input.amount && input.amount > 999999.99) {
      errors.push("Amount cannot exceed $999,999.99");
    }

    if (!input.type || !["income", "expense", "transfer"].includes(input.type)) {
      errors.push("Invalid transaction type");
    }

    if (!input.accountId) {
      errors.push("Account ID is required");
    }

    if (!input.categoryId) {
      errors.push("Category ID is required");
    }

    if (input.transactionDate) {
      const date = new Date(input.transactionDate);
      if (isNaN(date.getTime())) {
        errors.push("Invalid transaction date");
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date > tomorrow) {
        errors.push("Transaction date cannot be more than 1 day in the future");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }

    return true;
  }
}

module.exports = TransactionService;
