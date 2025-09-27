const { gql } = require('graphql-tag');
const _ = require('lodash');

const userTypeDefs = require('./schemas/user');
const userResolvers = require('./resolvers/user');
const categoryTypeDefs = require('./schemas/category');
const categoryResolvers = require('./resolvers/category');
const accountTypeDefs = require('./schemas/account');
const accountResolvers = require('./resolvers/account');

// Base type definitions
const baseTypeDefs = gql`
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
`;

// Combine all type definitions
const typeDefs = [baseTypeDefs, userTypeDefs, categoryTypeDefs, accountTypeDefs];

// Base resolvers
const baseResolvers = {
  Query: {
    _empty: () => null
  },
  
  Mutation: {
    _empty: () => null
  }
};

// Combine all resolvers
const resolvers = _.merge(
  baseResolvers,
  userResolvers,
  categoryResolvers,
  accountResolvers
);

module.exports = {
  typeDefs,
  resolvers
};