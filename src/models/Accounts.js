const db = require("../config/database");

class Account {
  constructor(accountData) {
    this.id = accountData.id;
    this.userId = accountData.user_id;
    this.name = accountData.name;
    this.accountType = accountData.account_type;
    this.bankName = accountData.bank_name;
    this.accountNumberLastFour = accountData.account_number_last_four;
    this.initialBalance = parseFloat(accountData.initial_balance || 0.0);
    this.currentBalance = parseFloat(accountData.current_balance || 0.0);
    this.currency = accountData.currency;
    this.color = accountData.color;
    this.icon = accountData.icon;
    this.active = accountData.is_active;
    this.isDefault = accountData.is_default;
    this.notes = accountData.notes;
    this.createdAt = accountData.createdAt;
    this.updatedAt = accountData.updatedAt;
  }

  static async create({
    userId,
    name,
    accountType,
    bankName,
    accountNumberLastFour,
    initialBalance = 0,
    color = "#6366f1",
    currency = "INR",
    icon = "credit_card",
    isDefault = false,
    notes = "",
  }) {
    try {
      const query = `
            INSERT INTO accounts (
                user_id, name, account_type, bank_name, account_number_last_four, 
                initial_balance, current_balance, color, currency, icon, is_default, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

      const values = [
        userId,
        name.trim(),
        accountType,
        bankName?.trim(),
        accountNumberLastFour,
        initialBalance,
        initialBalance,
        color,
        currency,
        icon,
        isDefault,
        notes?.trim(),
      ];

      const result = await db.query(query, values);

      return new Account(result.rows[0]);
    } catch (error) {
      if (error.code == "23505") {
        throw new Error("Account with this name already exists.");
      }

      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      let query = "SELECT * FROM accounts WHERE user_id = $1";
      const values = [userId];

      if (options.accountType) {
        values.push(options.accountType);
        query += ` AND type = $${values.length}`;
      }

      if (options.active !== undefined) {
        values.push(options.active);
        query += ` AND is_active = $${values.length}`;
      }

      query += " ORDER BY is_default DESC, name ASC";

      const result = await db.query(query, values);

      return result.rows.map((row) => new Account(row));
    } catch (error) {
      throw error;
    }
  }

  static async findByIdAndUserId(id, userId) {
    try {
      let query = "SELECT * FROM accounts WHERE id = $1 AND user_id = $2";
      const values = [id, userId];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return new Account(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  static async findDefaultByUserId(userId) {
    try {
      let query = "SELECT * FROM accounts WHERE user_id = $1 AND is_default = true AND is_active = true";
      const values = [userId];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return new Account(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async update({
    name,
    accountType,
    bankName,
    accountNumberLastFour,
    color,
    currency,
    icon,
    isDefault,
    active,
    notes,
  }) {
    try {
      const query = `
            UPDATE accounts
            SET name = $1, account_type = $2, bank_name = $3, account_number_last_four = $4, 
            currency = $5, color = $6, icon = $7, is_default = $8, is_active = $9, notes = $10
            WHERE id = $11 AND user_id = $12
            RETURNING *
        `;

      const values = [
        name?.trim() || this.name,
        accountType || this.accountType,
        bankName?.trim() || this.bankName,
        accountNumberLastFour || this.accountNumberLastFour,
        currency || this.currency,
        color || this.color,
        icon || this.icon,
        isDefault !== undefined ? isDefault : this.isDefault,
        active !== undefined ? active : this.active,
        notes?.trim() || this.notes,
        this.id,
        this.userId,
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("Account not found or access denied.");
      }

      const updatedAccount = new Account(result.rows[0]);
      Object.assign(this, updatedAccount);

      return this;
    } catch (error) {
      if (error.code == "23505") {
        throw new Error("Account with this name already exists.");
      }

      throw error;
    }
  }

  async updateBalance(newBalance) {
    try {
      const query = `
        UPDATE accounts 
        SET current_balance = $1
        WHERE id = $2 AND user_id = $3
        RETURNING current_balance
      `;

      const result = await db.query(query, [newBalance, this.id, this.userId]);

      if (result.rows.length === 0) {
        throw new Error("Account not found or access denied");
      }

      this.currentBalance = parseFloat(result.rows[0].current_balance);
      return this.currentBalance;
    } catch (error) {
      throw error;
    }
  }

  async deactivate() {
    try {
      const query = `
        UPDATE accounts 
        SET is_active = false, is_default = false
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await db.query(query, [this.id, this.userId]);

      if (result.rows.length === 0) {
        throw new Error("Account not found or access denied");
      }

      this.active = false;
      this.isDefault = false;
      return this;
    } catch (error) {
      throw error;
    }
  }

  async delete() {
    try {
      const query = "DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING *";
      const result = await db.query(query, [this.id, this.userId]);

      if (result.rows.length === 0) {
        throw new Error("Account not found or access denied");
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getAccountsSummary(userId) {
    try {
      const query = `
        SELECT 
          account_type,
          COUNT(*) as account_count,
          SUM(current_balance) as total_balance,
          currency
        FROM accounts 
        WHERE user_id = $1 AND is_active = true
        GROUP BY account_type, currency
        ORDER BY account_type
      `;

      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async createDefaultAccounts(userId) {
    const defaultAccounts = [
      {
        name: "Primary Checking",
        accountType: "checking",
        bankName: "My Bank",
        color: "#10b981",
        icon: "banknote",
        isDefault: true,
        notes: "Primary checking account",
      },
      {
        name: "Savings Account",
        accountType: "savings",
        bankName: "My Bank",
        color: "#3b82f6",
        icon: "piggy-bank",
        notes: "Savings account",
      },
      {
        name: "Cash Wallet",
        accountType: "cash",
        color: "#f59e0b",
        icon: "wallet",
        notes: "Physical cash and coins",
      },
    ];

    try {
      const createdAccounts = [];

      for (const accountData of defaultAccounts) {
        try {
          const account = await this.create({
            userId,
            ...accountData,
          });
          createdAccounts.push(account);
        } catch (error) {
          console.log(`Skipping existing account: ${accountData.name}`);
        }
      }

      return createdAccounts;
    } catch (error) {
      throw error;
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      accountType: this.accountType,
      bankName: this.bankName,
      accountNumberLastFour: this.accountNumberLastFour,
      initialBalance: this.initialBalance,
      currentBalance: this.currentBalance,
      currency: this.currency,
      color: this.color,
      icon: this.icon,
      active: this.active,
      isDefault: this.isDefault,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Account;
