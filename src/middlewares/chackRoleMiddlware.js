import {
  sendForbiddenResponse,
  sendServerErrorResponse,
} from "../utils/responseUtils.js";
import logger from "../utils/logger.js";
import { getOne } from "../utils/dbUtils.js";

// Middleware to check if the user has the required role
export const checkRole = (role) => {
  return async (req, res, next) => {
    try {
      const user = await getOne("users", { id: req.user.id });
      if (!user) {
        logger.warn(`User not found: ${req.user?.id}`);
        return sendForbiddenResponse(
          res,
          "Access denied. You do not have the permissions to access this endpoint"
        );
      }

      const roleRecord = await getOne("roles", { id: user.role_id });
      if (!roleRecord) {
        return sendServerErrorResponse(res, "Role not found");
      }

      if (roleRecord.name === "ADMIN" || roleRecord.name === role) {
        return next();
      }

      logger.warn(
        `User with role ${roleRecord.name} attempted to access a restricted endpoint.`
      );
      return sendForbiddenResponse(
        res,
        "Access denied. You do not have the permissions to access this endpoint"
      );
    } catch (error) {
      logger.error(`Error checking role: ${error.message}`);
      return sendServerErrorResponse(
        res,
        "An error occurred while checking the role"
      );
    }
  };
};
