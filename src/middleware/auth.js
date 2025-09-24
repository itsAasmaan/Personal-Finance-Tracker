const AuthService = require("../services/authService");

function extractTokenFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }

  return null;
}

async function getAuthenticatedUser(req) {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return null;
    }

    const user = await AuthService.verifyToken(token);
    return user;
  } catch (error) {
    console.error("Authentication error:", error.message);
    return null;
  }
}

function requireAuth(user) {
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

function isAuthenticated(user) {
  return user !== null && user !== undefined;
}

module.exports = {
  extractTokenFromRequest,
  getAuthenticatedUser,
  requireAuth,
  isAuthenticated,
};
