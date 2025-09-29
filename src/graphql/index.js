const { gql } = require("graphql-tag");
const _ = require("lodash");

const userTypeDefs = require("./schemas/user");
const userResolvers = require("./resolvers/user");
const categoryTypeDefs = require("./schemas/category");
const categoryResolvers = require("./resolvers/category");
const accountTypeDefs = require("./schemas/account");
const accountResolvers = require("./resolvers/account");
const transactionTypeDefs = require("./schemas/transaction");
const transactionResolvers = require("./resolvers/transaction");

const baseTypeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

const typeDefs = [baseTypeDefs, userTypeDefs, categoryTypeDefs, accountTypeDefs, transactionTypeDefs];

const baseResolvers = {
  Query: {},
  Mutation: {},
};

const resolvers = _.merge(baseResolvers, userResolvers, categoryResolvers, accountResolvers, transactionResolvers);

module.exports = {
  typeDefs,
  resolvers,
};
