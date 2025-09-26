const createApp = require("./src/app");
const config = require("./src/config/environment");

async function startServer() {
  try {
    console.log("Starting Personal Finance Tracker Server...\n");
    const { app } = await createApp();

    app.listen(config.port, () => {
      console.log(`Server: http://localhost:${config.port}`);
      if (config.nodeEnv === "development") {
        console.log("Use Apollo Studio Sandbox for GraphQL operations:");
        console.log("https://studio.apollographql.com/sandbox/explorer");
        console.log(`GraphQL Endpoint: http://localhost:${config.port}/graphql`);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

startServer();
