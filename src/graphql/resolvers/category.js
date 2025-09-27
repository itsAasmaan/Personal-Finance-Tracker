const Category = require("../../models/Category");
const { requireAuth } = require("../../middleware/auth");

const categoryResolver = {
  Query: {
    categories: async (parent, { filter = {} }, context) => {
      const user = requireAuth(context.user);

      const options = {};

      if (filter.type) {
        options.type = filter.type;
      }

      if (filter.active !== undefined) {
        options.active = filter.active;
      }

      const categories = await Category.findByUserId(user.id, options);

      return categories.map((category) => category.toJSON());
    },

    category: async (parent, { id }, context) => {
      const user = requireAuth(context.user);

      const category = await Category.findByIdAndUserId(id, user.id);

      if (!category) {
        throw new Error("Category not found");
      }

      return category.toJSON();
    },

    incomeCategories: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const categories = await Category.findByUserId(user.id, {
        type: "income",
        active: true,
      });

      return categories.map((category) => category.toJSON());
    },

    incomeCategories: async (parent, args, context) => {
      const user = requireAuth(context.user);

      const categories = await Category.findByUserId(user.id, {
        type: "income",
        active: true,
      });

      return categories.map((category) => category.toJSON());
    },
  },

  Mutation: {
    createCategory: async (parent, { input }, context) => {
      try {
        const user = requireAuth(context.user);

        const categoryData = {
          userId: user.id,
          name: input.name,
          description: input.description,
          color: input.color || "#6366f1",
          icon: input.icon || "folder",
          type: input.type.toLowerCase(),
        };

        const category = await Category.create(categoryData);

        return category.toJSON();
      } catch (error) {
        throw new Error(`Failed to create category: ${error.message}`);
      }
    },

    updateCategory: async (parent, { id, input }, context) => {
      try {
        const user = requireAuth(context.user);

        const category = await Category.findByIdAndUserId(id, user.id);

        if (!category) {
          throw new Error("Category not found");
        }

        const updateData = { ...input };
        if (updateData.type) {
          updateData.type = updateData.type.toLowerCase();
        }

        category = await Category.update(categoryData);

        return category.toJSON();
      } catch (error) {
        throw new Error(`Failed to update category: ${error.message}`);
      }
    },

    deactivateCategory: async (parent, { id }, context) => {
      try {
        const user = requireAuth(user);

        const category = Category.findByIdAndUserId(id, user.id);

        if (!category) {
          throw new Error("Category not found");
        }

        return (await category.deactivateCategory()).toJSON();
      } catch (error) {
        throw new Error(`Failed to deactive category: ${error.message}`);
      }
    },

    deleteCategory: async (parent, { id }, context) => {
      try {
        const user = requireAuth(user);

        const category = Category.findByIdAndUserId(id, user.id);

        if (!category) {
          throw new Error("Category not found");
        }

        const result = await category.delete();

        return result;
      } catch (error) {
        throw new Error(`Failed to deactive category: ${error.message}`);
      }
    },

    createDefaultCategories: async (parent, { category }, context) => {
      try {
        const user = requireAuth(context.user);

        const categories = await Category.createDefaultCategories(user.id);

        return categories.map((category) => category.toJSON());
      } catch (error) {
        throw new Error(
          `Failed to create default categories: ${error.message}`
        );
      }
    },
  },

  CategoryType: {
    INCOME: "income",
    EXPENSE: "expense",
  },
};

module.exports = categoryResolver;
