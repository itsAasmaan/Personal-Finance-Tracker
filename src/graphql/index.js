const { gql } = require("graphql-tag");

const typeDefs = gql`
  type Query {
    hello: String
    serverStatus: ServerStatus
  }

  type ServerStatus {
    message: String
    timestamp: String
    database: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello from Personal Finance Tracker GraphQL API!",

    serverStatus: async () => {
      const db = require("../config/database");
      let dbStatus = "disconnected";

      try {
        await db.query("SELECT 1");
        dbStatus = "connected";
      } catch (error) {
        dbStatus = "error";
      }

      return {
        message: "Server is running successfully",
        timestamp: new Date().toISOString(),
        database: dbStatus,
      };
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
