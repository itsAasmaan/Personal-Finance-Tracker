const AuthService = require("../../services/authService");
const { requireAuth } = require("../../middleware/auth");

const userResolvers = {
  Query: {
    me: async (parent, args, context) => {
      const user = requireAuth(context.user);
      return user.toJSON();
    },

    whoAmI: async (parent, args, context) => {
      const user = requireAuth(context.user);
      return `Hello ${user.fullName}! You are successfully authenticated.`;
    },
  },

  Mutation: {
    register: async (parent, { input }) => {
      try {
        const { user, token } = await AuthService.register(input);

        return {
          user: user.toJSON(),
          token,
        };
      } catch (error) {
        throw new Error(`Registration failed: ${error.message}`);
      }
    },

    login: async (parent, { input }) => {
      try {
        const { user, token } = await AuthService.login(input);

        return {
          user: user.toJSON(),
          token,
        };
      } catch (error) {
        throw new Error(`Login failed: ${error.message}`);
      }
    },

    updateProfile: async (parent, { input }, context) => {
      try {
        const user = requireAuth(context.user);
        const updatedUser = await user.update(input);

        return updatedUser.toJSON();
      } catch (error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }
    },
  },
};

module.exports = userResolvers;
