const db = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  constructor(userData) {
    this.id = userData.id;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.email = userData.email;
    this.passwordHash = userData.password_hash;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Get full name
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Create a new user
  static async create({ firstName, lastName, email, password }) {
    try {
      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, first_name, last_name, email, created_at, updated_at
      `;

      const values = [firstName, lastName, email.toLowerCase(), passwordHash];
      const result = await db.query(query, values);

      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        throw new Error("Email already exists");
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const result = await db.query(query, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Validate password
  async validatePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Update user profile
  async update({ firstName, lastName }) {
    try {
      const query = `
        UPDATE users 
        SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, first_name, last_name, email, created_at, updated_at
      `;

      const values = [firstName, lastName, this.id];
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      // Update current instance
      const updatedUser = new User(result.rows[0]);
      this.firstName = updatedUser.firstName;
      this.lastName = updatedUser.lastName;
      this.updatedAt = updatedUser.updatedAt;

      return this;
    } catch (error) {
      throw error;
    }
  }

  // Get user data without password hash (for API responses)
  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
