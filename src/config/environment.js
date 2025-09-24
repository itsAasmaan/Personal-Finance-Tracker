const dotenv = require("dotenv");

dotenv.config(__dirname + "/../../.env");

const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};

const requiredEnvironmentVariables = [
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvironmentVariables.length > 0) {
  console.error(
    "Missing required environment variables: ",
    missingEnvironmentVariables
  );
  process.exit(1);
}

module.exports = config;
