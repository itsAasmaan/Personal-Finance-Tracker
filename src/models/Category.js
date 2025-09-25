const db = require("../config/database");

class Category {
  constructor(categoryData) {
    this.id = categoryData.id;
    this.userId = categoryData.user_id;
    this.name = categoryData.name;
    this.description = categoryData.description;
    this.color = categoryData.color;
    this.icon = categoryData.icon;
    this.type = categoryData.type;
    this.active = categoryData.is_active;
    this.createdAt = categoryData.created_at;
    this.updatedAt = categoryData.updated_at;
  }

  static async create({ userId, name, description, color, icon, type }) {
    try {
      const query = `
                INSERT INTO categories (user_id, name, description, color, icon, type)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;

      const values = [
        userId,
        name.trim(),
        description?.trim(),
        color,
        icon,
        type,
      ];

      const result = await db.query(query, values);

      return new Category(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Category with this name already exists for the user.");
      }
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      let query = "SELECT * FROM categories WHERE user_id = $1";
      const values = [userId];

      if (options.type) {
        values.push(options.type);
        query += ` AND type = $${values.length}`;
      }

      if (options.active !== undefined) {
        values.push(options.active);
        query += ` AND is_active = $${values.length}`;
      }

      query += " ORDER BY name ASC";

      const result = await db.query(query, values);

      return result.rows.map((row) => new Category(row));
    } catch (error) {
      throw error;
    }
  }

  static async findByIdAndUserId(id, userId) {
    try {
      let query = "SELECT * FROM categories WHERE id = $1 AND user_id = $2";
      const values = [id, userId];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return new Category(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  async update({ name, description, color, icon, type, active }) {
    try {
      const query = `
        UPDATE categories 
        SET name = $1, description = $2, color = $3, icon = $4, type = $5, is_active = $6
        WHERE id = $7 AND user_id = $8
        RETURNING *
      `;

      const values = [
        name?.trim() || this.name,
        description?.trim() || this.description,
        color || this.color,
        icon || this.icon,
        type || this.type,
        active !== undefined ? active : this.active,
        this.id,
        this.userId,
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("Category not found or access denied");
      }

      const updatedCategory = new Category(result.rows[0]);
      Object.assign(this, updatedCategory);

      return this;
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Category with this name already exists");
      }
      throw error;
    }
  }

  // Soft delete (deactivate) category
  async deactivate() {
    try {
      const query = `
        UPDATE categories 
        SET is_active = false
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await db.query(query, [this.id, this.userId]);

      if (result.rows.length === 0) {
        throw new Error("Category not found or access denied");
      }

      this.isActive = false;
      return this;
    } catch (error) {
      throw error;
    }
  }

  async delete() {
    try {
      // TODO: later will introduce transations, so will check if category has transactions before deletion
      const query =
        "DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING *";
      const result = await db.query(query, [this.id, this.userId]);

      if (result.rows.length === 0) {
        throw new Error("Category not found or access denied");
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async createDefaultCategories(userId) {
    const defaultCategories = [
      // Expense Categories
      {
        name: "Food & Dining",
        description: "Restaurants, groceries, food delivery",
        color: "#ef4444",
        icon: "utensils",
        type: "expense",
      },
      {
        name: "Transportation",
        description: "Gas, public transport, car maintenance",
        color: "#3b82f6",
        icon: "car",
        type: "expense",
      },
      {
        name: "Shopping",
        description: "Clothing, electronics, general purchases",
        color: "#8b5cf6",
        icon: "shopping-bag",
        type: "expense",
      },
      {
        name: "Entertainment",
        description: "Movies, games, hobbies, subscriptions",
        color: "#f59e0b",
        icon: "gamepad-2",
        type: "expense",
      },
      {
        name: "Bills & Utilities",
        description: "Rent, electricity, internet, phone",
        color: "#dc2626",
        icon: "receipt",
        type: "expense",
      },
      {
        name: "Healthcare",
        description: "Medical expenses, insurance, pharmacy",
        color: "#059669",
        icon: "heart-pulse",
        type: "expense",
      },
      {
        name: "Other Expense",
        description: "Miscellaneous expenses",
        color: "#6b7280",
        icon: "more-horizontal",
        type: "expense",
      },

      // Income Categories
      {
        name: "Salary",
        description: "Primary job income",
        color: "#10b981",
        icon: "briefcase",
        type: "income",
      },
      {
        name: "Freelance",
        description: "Contract work and side projects",
        color: "#8b5cf6",
        icon: "laptop",
        type: "income",
      },
      {
        name: "Investment Returns",
        description: "Dividends, interest, capital gains",
        color: "#f59e0b",
        icon: "trending-up",
        type: "income",
      },
      {
        name: "Gift/Bonus",
        description: "Gifts received, work bonuses",
        color: "#ec4899",
        icon: "gift",
        type: "income",
      },
      {
        name: "Other Income",
        description: "Miscellaneous income sources",
        color: "#6b7280",
        icon: "plus",
        type: "income",
      },
    ];

    try {
      const createdCategories = [];

      for (const categoryData of defaultCategories) {
        try {
          const category = await this.create({
            userId,
            ...categoryData,
          });
          createdCategories.push(category);
        } catch (error) {
          // Skip if category already exists
          console.log(`Skipping existing category: ${categoryData.name}`);
        }
      }

      return createdCategories;
    } catch (error) {
      throw error;
    }
  }

  // for API responses
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      description: this.description,
      color: this.color,
      icon: this.icon,
      type: this.type,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Category;
