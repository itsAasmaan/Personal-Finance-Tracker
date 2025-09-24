const { gql } = require('graphql-tag');
const userTypeDefs = require('./schemas/user');
const userResolvers = require('./resolvers/user');

// Base type definitions
const baseTypeDefs = gql`
  type Query {
    hello: String
    serverStatus: ServerStatus
  }
  
  type Mutation {
    _empty: String
  }
  
  type ServerStatus {
    message: String
    timestamp: String
    database: String
  }
`;

// Combine all type definitions
const typeDefs = [baseTypeDefs, userTypeDefs];

// Base resolvers
const baseResolvers = {
  Query: {
    hello: () => 'Hello from Personal Finance Tracker GraphQL API! 🚀',
    
    serverStatus: async () => {
      const db = require('../config/database');
      let dbStatus = 'disconnected';
      
      try {
        await db.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'error';
      }
      
      return {
        message: 'Server is running successfully',
        timestamp: new Date().toISOString(),
        database: dbStatus
      };
    }
  },
  
  Mutation: {
    _empty: () => null
  }
};

// Combine all resolvers
const resolvers = {
  Query: {
    ...baseResolvers.Query,
    ...userResolvers.Query
  },
  Mutation: {
    ...baseResolvers.Mutation,
    ...userResolvers.Mutation
  }
};

module.exports = {
  typeDefs,
  resolvers
};