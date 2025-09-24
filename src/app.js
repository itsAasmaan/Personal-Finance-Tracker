const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const helmet = require("helmet");

const config = require("./config/environment");
const { typeDefs, resolvers } = require("./graphql");

async function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  const allowedOrigins = [config.cors.origin, "https://studio.apollographql.com"];
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: config.nodeEnv !== "production",
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    })
  );

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Personal Finance Tracker API",
      version: "1.0.0",
      graphql: "/graphql",
      studio:
        config.nodeEnv !== "production"
          ? "Visit Apollo Studio at https://studio.apollographql.com/sandbox/explorer for GraphQL operations"
          : null,
    });
  });

  return { app, server };
}

module.exports = createApp;
