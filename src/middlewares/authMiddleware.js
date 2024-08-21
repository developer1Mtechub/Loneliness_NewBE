import { verifyToken } from "../utils/authUtils.js";
import logger from "../utils/logger.js";
import { sendUnauthorizedResponse } from "../utils/responseUtils.js";

export const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return sendUnauthorizedResponse(res, "Access denied. No token provided.");
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Invalid token: ${error.message}`);
    return sendUnauthorizedResponse(res, "INVALID_ACCESS_TOKEN");
  }
};
