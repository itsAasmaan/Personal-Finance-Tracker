const { gql } = require("graphql-tag");

const categoryTypeDefs = gql`
  type Category {
    id: ID!
    userId: ID!
    name: String!
    description: String
    color: String!
    icon: String!
    type: CategoryType!
    active: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  enum CategoryType {
    INCOME
    EXPENSE
  }

  input createCategoryInput {
    name: String!
    description: String
    color: String
    icon: String
    type: CategoryType!
  }

  input updateCategoryInput {
    name: String
    description: String
    color: String
    icon: String
    type: CategoryType
    active: Boolean
  }

  input categoryFilter {
    type: CategoryType
    active: Boolean
  }

  extend type Query {
    categories(filter: categoryFilter): [Category!]!

    category(id: ID!): Category

    incomeCategories: [Category!]!

    expenseCategories: [Category!]!
  }

  extend type Mutation {
    createCategory(input: createCategoryInput!): Category!

    updateCategory(id: ID!, input: updateCategoryInput!): Category!

    deactivateCategory(id: ID!): Category!

    deleteCategory(id: ID!): Boolean!

    createDefaultCategories: [Category!]!
  }
`;

module.exports = categoryTypeDefs;
