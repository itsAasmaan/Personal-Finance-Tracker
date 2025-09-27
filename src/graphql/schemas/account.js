const { gql } = require("graphql-tag");

const accountTypeDefs = gql`
    enum AccountType {
        CHECKING
        SAVINGS
        CREDIT_CARD
        DEBIT_CARD
        LOAN
        CASH
        INVESTMENT
        OTHER
    }
    type Account {
        id: ID!
        userId: ID!
        name: String!
        accountType: AccountType!
        bankName: String
        accountNumberLastFour: String
        initialBalance: Float!
        currentBalance: Float!
        currency: String!
        color: String!
        icon: String!
        active: Boolean!
        isDefault: Boolean!
        notes: String
        createdAt: String!
        updatedAt: String!
    }

    input CreateAccountInput {
        name: String!
        accountType: AccountType!
        bankName: String
        accountNumberLastFour: String
        initialBalance: Float
        currency: String
        color: String
        icon: String
        isDefault: Boolean
        notes: String   
    }

    input UpdateAccountInput {
        name: String
        accountType: AccountType
        bankName: String
        accountNumberLastFour: String\
        currency: String
        color: String
        icon: String
        isDefault: Boolean
        active: Boolean
        notes: String   
    }

    input AccountFilterInput {
        accountType: AccountType
        active: Boolean
    }

    type AccountSummary {
        accountType: AccountType!
        accountCount: Int!
        totalBalance: Float!
        currency: String!
    }

    extend type Query {
        accounts(filter: AccountFilterInput): [Account!]!

        account(id: ID!): Account

        defaultAccount: Account

        accountSummary: [AccountSummary!]!

        checkingAccounts: [Account!]!

        savingsAccounts: [Account!]!

        creditCardAccounts: [Account!]!
    }

    extend type Mutation {
        createAccount(input: CreateAccountInput!): Account!

        updateAccount(id: ID!, input: UpdateAccountInput!): Account!
    
        setDefaultAccount(id: ID!): Account!
        
        deactivateAccount(id: ID!): Account!
        
        deleteAccount(id: ID!): Boolean!
        
        createDefaultAccounts: [Account!]!
        
        updateAccountBalance(id: ID!, balance: Float!): Account!
    }
`;

module.exports = accountTypeDefs;
