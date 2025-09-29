const { gql } = require("graphql-tag");

const transactionTypeDefs = gql`
  type Transaction {
    id: ID!
    userId: ID!
    accountId: ID!
    categoryId: ID!
    type: TransactionType!
    amount: Float!
    description: String!
    notes: String
    transactionDate: String!
    createdAt: String!
    updatedAt: String!
    transferAccountId: ID
    transferTransactionId: ID
    referenceNumber: String
    location: String
    tags: [String!]

    account: TransactionAccount
    category: TransactionCategory
    transferAccount: TransactionAccount
  }

  type TransactionAccount {
    id: ID!
    name: String!
    accountType: String!
    color: String!
  }

  type TransactionCategory {
    id: ID!
    name: String!
    color: String!
    icon: String!
  }

  enum TransactionType {
    INCOME
    EXPENSE
    TRANSFER
  }

  type TransactionStats {
    type: TransactionType!
    transactionCount: Int!
    totalAmount: Float!
    averageAmount: Float!
    minAmount: Float!
    maxAmount: Float!
  }

  type MonthlySummary {
    totalIncome: Float!
    totalExpenses: Float!
    netIncome: Float!
    transactionCount: Int!
    expensesByCategory: [CategorySummary!]!
    incomeByCategory: [CategorySummary!]!
    transactionsByAccount: [AccountSummary!]!
  }

  type CategorySummary {
    name: String!
    amount: Float!
    count: Int!
    color: String!
  }

  type AccountSummary {
    name: String!
    income: Float!
    expenses: Float!
    count: Int!
    color: String!
  }

  type SpendingTrend {
    period: String!
    income: Float!
    expenses: Float!
    netIncome: Float!
    transactionCount: Int!
  }

  input CreateTransactionInput {
    accountId: ID!
    categoryId: ID!
    type: TransactionType!
    amount: Float!
    description: String!
    notes: String
    transactionDate: String
    transferAccountId: ID
    referenceNumber: String
    location: String
    tags: [String!]
  }

  input UpdateTransactionInput {
    accountId: ID
    categoryId: ID
    type: TransactionType
    amount: Float
    description: String
    notes: String
    transactionDate: String
    transferAccountId: ID
    referenceNumber: String
    location: String
    tags: [String!]
  }

  input TransactionFilterInput {
    type: TransactionType
    accountId: ID
    categoryId: ID
    startDate: String
    endDate: String
    minAmount: Float
    maxAmount: Float
    search: String
    orderBy: String
    orderDirection: String
    limit: Int
    offset: Int
  }

  extend type Query {
    transactions(filter: TransactionFilterInput): [Transaction!]!

    transaction(id: ID!): Transaction

    recentTransactions(limit: Int): [Transaction!]!

    transactionsByDateRange(startDate: String!, endDate: String!): [Transaction!]!

    accountTransactions(accountId: ID!, limit: Int): [Transaction!]!

    categoryTransactions(categoryId: ID!, limit: Int): [Transaction!]!

    searchTransactions(query: String!, limit: Int): [Transaction!]!

    transactionStats(startDate: String, endDate: String): [TransactionStats!]!

    monthlyTransactionSummary(year: Int!, month: Int!): MonthlySummary!

    spendingTrends: [SpendingTrend!]!

    expenseTransactions(limit: Int): [Transaction!]!

    incomeTransactions(limit: Int): [Transaction!]!
  }

  extend type Mutation {
    createTransaction(input: CreateTransactionInput!): Transaction!

    updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!

    deleteTransaction(id: ID!): Boolean!

    createQuickExpense(amount: Float!, description: String!, categoryId: ID!, accountId: ID): Transaction!

    createQuickIncome(amount: Float!, description: String!, categoryId: ID!, accountId: ID): Transaction!
  }
`;

module.exports = transactionTypeDefs;
