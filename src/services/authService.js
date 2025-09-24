const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/environment");

class AuthService {
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
      if (error.name === "TokenExpiredError") {
        throw new Error("Token expired");
      }
      throw error;
    }
  }

  static async register({ firstName, lastName, email, password }) {
    try {
      this.validateRegistrationInput({ firstName, lastName, email, password });

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const user = await User.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      const token = this.generateToken(user);

      return {
        user,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  static async login({ email, password }) {
    try {
      this.validateLoginInput({ email, password });

      const user = await User.findByEmail(email.trim());
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      const token = this.generateToken(user);

      return {
        user,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser(token) {
    try {
      return await this.verifyToken(token);
    } catch (error) {
      throw error;
    }
  }

  static validateRegistrationInput({ firstName, lastName, email, password }) {
    const errors = [];

    if (!firstName || firstName.trim().length < 2) {
      errors.push("First name must be at least 2 characters long");
    }

    if (!lastName || lastName.trim().length < 2) {
      errors.push("Last name must be at least 2 characters long");
    }

    if (!email || !this.isValidEmail(email.trim())) {
      errors.push("Please provide a valid email address");
    }

    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  }

  static validateLoginInput({ email, password }) {
    const errors = [];

    if (!email || email.trim().length === 0) {
      errors.push("Email is required");
    }

    if (!password || password.length === 0) {
      errors.push("Password is required");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = AuthService;
