const db = require("../config/database");

class Transaction {
  constructor(transactionData) {
    this.id = transactionData.id;
    this.userId = transactionData.user_id;
    this.accountId = transactionData.account_id;
    this.categoryId = transactionData.category_id;
    this.type = transactionData.type;
    this.amount = parseFloat(transactionData.amount);
    this.description = transactionData.description;
    this.notes = transactionData.notes;
    this.transactionDate = transactionData.transaction_date;
    this.createdAt = transactionData.created_at;
    this.updatedAt = transactionData.updated_at;
    this.transferAccountId = transactionData.transfer_account_id;
    this.transferTransactionId = transactionData.transfer_transaction_id;
    this.referenceNumber = transactionData.reference_number;
    this.location = transactionData.location;
    this.tags = transactionData.tags || [];

    // Additional data (will manage by joins)
    this.account = null;
    this.category = null;
    this.transferAccount = null;
  }

  static async create({
    userId,
    accountId,
    categoryId,
    type,
    amount,
    description,
    notes,
    transactionDate,
    transferAccountId,
    referenceNumber,
    location,
    tags = [],
  }) {
    try {
      await this.validateTransaction({
        userId,
        accountId,
        categoryId,
        type,
        amount,
        transferAccountId,
      });

      const query = `
        INSERT INTO transactions (
          user_id, account_id, category_id, type, amount, description,
          notes, transaction_date, transfer_account_id, reference_number,
          location, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        userId,
        accountId,
        categoryId,
        type,
        amount,
        description.trim(),
        notes?.trim(),
        transactionDate || new Date().toISOString().split("T")[0],
        transferAccountId,
        referenceNumber?.trim(),
        location?.trim(),
        tags,
      ];

      const result = await db.query(query, values);
      return new Transaction(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  static async validateTransaction({
    userId,
    accountId,
    categoryId,
    type,
    amount,
    transferAccountId,
  }) {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Validate account belongs to user
    const accountQuery =
      "SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true";
    const accountResult = await db.query(accountQuery, [accountId, userId]);
    if (accountResult.rows.length === 0) {
      throw new Error("Account not found or inactive");
    }

    // Validate category belongs to user and matches transaction type
    const categoryQuery =
      "SELECT id, type FROM categories WHERE id = $1 AND user_id = $2 AND is_active = true";
    const categoryResult = await db.query(categoryQuery, [categoryId, userId]);
    if (categoryResult.rows.length === 0) {
      throw new Error("Category not found or inactive");
    }

    const categoryType = categoryResult.rows[0].type;
    if (categoryType !== type && type !== "transfer") {
      throw new Error(
        `Category type '${categoryType}' does not match transaction type '${type}'`
      );
    }

    // Validate transfer account if it's a transfer transaction
    if (type === "transfer") {
      if (!transferAccountId) {
        throw new Error(
          "Transfer account is required for transfer transactions"
        );
      }

      const transferAccountResult = await db.query(accountQuery, [
        transferAccountId,
        userId,
      ]);
      if (transferAccountResult.rows.length === 0) {
        throw new Error("Transfer account not found or inactive");
      }

      if (accountId === transferAccountId) {
        throw new Error("Cannot transfer to the same account");
      }
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      let query = `
        SELECT 
          t.*,
          a.name as account_name, a.account_type, a.color as account_color,
          c.name as category_name, c.color as category_color, c.icon as category_icon,
          ta.name as transfer_account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
        WHERE t.user_id = $1
      `;

      const values = [userId];
      let paramIndex = 2;

      if (options.type) {
        query += ` AND t.type = $${paramIndex}`;
        values.push(options.type);
        paramIndex++;
      }

      if (options.accountId) {
        query += ` AND t.account_id = $${paramIndex}`;
        values.push(options.accountId);
        paramIndex++;
      }

      if (options.categoryId) {
        query += ` AND t.category_id = $${paramIndex}`;
        values.push(options.categoryId);
        paramIndex++;
      }

      if (options.startDate) {
        query += ` AND t.transaction_date >= $${paramIndex}`;
        values.push(options.startDate);
        paramIndex++;
      }

      if (options.endDate) {
        query += ` AND t.transaction_date <= $${paramIndex}`;
        values.push(options.endDate);
        paramIndex++;
      }

      if (options.minAmount) {
        query += ` AND t.amount >= $${paramIndex}`;
        values.push(options.minAmount);
        paramIndex++;
      }

      if (options.maxAmount) {
        query += ` AND t.amount <= $${paramIndex}`;
        values.push(options.maxAmount);
        paramIndex++;
      }

      // search
      if (options.search) {
        query += ` AND (
          LOWER(t.description) LIKE LOWER($${paramIndex}) OR 
          LOWER(t.notes) LIKE LOWER($${paramIndex}) OR
          LOWER(a.name) LIKE LOWER($${paramIndex}) OR
          LOWER(c.name) LIKE LOWER($${paramIndex})
        )`;
        values.push(`%${options.search}%`);
        paramIndex++;
      }

      const orderBy = options.orderBy || "transaction_date";
      const orderDirection = options.orderDirection || "DESC";
      query += ` ORDER BY t.${orderBy} ${orderDirection}`;

      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(options.limit);
        paramIndex++;

        if (options.offset) {
          query += ` OFFSET $${paramIndex}`;
          values.push(options.offset);
          paramIndex++;
        }
      }

      const result = await db.query(query, values);
      return result.rows.map((row) => {
        const transaction = new Transaction(row);
        transaction.account = {
          id: transaction.accountId,
          name: row.account_name,
          accountType: row.account_type,
          color: row.account_color,
        };

        transaction.category = {
          id: transaction.categoryId,
          name: row.category_name,
          color: row.category_color,
          icon: row.category_icon,
        };

        if (transaction.transferAccountId) {
          transaction.transferAccount = {
            id: transaction.transferAccountId,
            name: row.transfer_account_name,
          };
        }

        return transaction;
      });
    } catch (error) {
      throw error;
    }
  }

  static async findByIdAndUserId(id, userId) {
    try {
      const query = `
        SELECT 
          t.*,
          a.name as account_name, a.account_type, a.color as account_color,
          c.name as category_name, c.color as category_color, c.icon as category_icon,
          ta.name as transfer_account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts ta ON t.transfer_account_id = ta.id
        WHERE t.id = $1 AND t.user_id = $2
      `;

      const result = await db.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const transaction = new Transaction(result.rows[0]);
      const row = result.rows[0];

      transaction.account = {
        id: transaction.accountId,
        name: row.account_name,
        accountType: row.account_type,
        color: row.account_color,
      };

      transaction.category = {
        id: transaction.categoryId,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
      };

      if (transaction.transferAccountId) {
        transaction.transferAccount = {
          id: transaction.transferAccountId,
          name: row.transfer_account_name,
        };
      }

      return transaction;
    } catch (error) {
      throw error;
    }
  }

  // Update transaction
  async update({
    accountId,
    categoryId,
    type,
    amount,
    description,
    notes,
    transactionDate,
    transferAccountId,
    referenceNumber,
    location,
    tags,
  }) {
    try {
      await Transaction.validateTransaction({
        userId: this.userId,
        accountId: accountId || this.accountId,
        categoryId: categoryId || this.categoryId,
        type: type || this.type,
        amount: amount || this.amount,
        transferAccountId: transferAccountId || this.transferAccountId,
      });

      const query = `
        UPDATE transactions 
        SET account_id = $1, category_id = $2, type = $3, amount = $4,
            description = $5, notes = $6, transaction_date = $7,
            transfer_account_id = $8, reference_number = $9, location = $10, tags = $11
        WHERE id = $12 AND user_id = $13
        RETURNING *
      `;

      const values = [
        accountId || this.accountId,
        categoryId || this.categoryId,
        type || this.type,
        amount || this.amount,
        description?.trim() || this.description,
        notes?.trim() || this.notes,
        transactionDate || this.transactionDate,
        transferAccountId || this.transferAccountId,
        referenceNumber?.trim() || this.referenceNumber,
        location?.trim() || this.location,
        tags || this.tags,
        this.id,
        this.userId,
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("Transaction not found or access denied");
      }

      const updatedTransaction = new Transaction(result.rows[0]);
      Object.assign(this, updatedTransaction);

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Delete transaction
  async delete() {
    try {
      const query =
        "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *";
      const result = await db.query(query, [this.id, this.userId]);

      if (result.rows.length === 0) {
        throw new Error("Transaction not found or access denied");
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get transaction statistics for a user
  static async getTransactionStats(userId, options = {}) {
    try {
      let query = `
        SELECT 
          type,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM transactions 
        WHERE user_id = $1
      `;

      const values = [userId];
      let paramIndex = 2;

      // date filters
      if (options.startDate) {
        query += ` AND transaction_date >= $${paramIndex}`;
        values.push(options.startDate);
        paramIndex++;
      }

      if (options.endDate) {
        query += ` AND transaction_date <= $${paramIndex}`;
        values.push(options.endDate);
        paramIndex++;
      }

      query += " GROUP BY type ORDER BY type";

      const result = await db.query(query, values);
      return result.rows.map((row) => ({
        type: row.type,
        transactionCount: parseInt(row.transaction_count),
        totalAmount: parseFloat(row.total_amount),
        averageAmount: parseFloat(row.average_amount),
        minAmount: parseFloat(row.min_amount),
        maxAmount: parseFloat(row.max_amount),
      }));
    } catch (error) {
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      accountId: this.accountId,
      categoryId: this.categoryId,
      type: this.type,
      amount: this.amount,
      description: this.description,
      notes: this.notes,
      transactionDate: this.transactionDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      transferAccountId: this.transferAccountId,
      transferTransactionId: this.transferTransactionId,
      referenceNumber: this.referenceNumber,
      location: this.location,
      tags: this.tags,
      account: this.account,
      category: this.category,
      transferAccount: this.transferAccount,
    };
  }
}

module.exports = Transaction;
