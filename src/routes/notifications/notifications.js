import express from "express";
import {
  getAll,
  updateReadStatus,
} from "../../controllers/notifications/notifications.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { updateStatusSchema } from "../../lib/validations/notificationValidation.js";

const router = express.Router();

router.put(
  "/update-status",
  authenticateToken,
  // checkRole("ADMIN"),
  validateRequest(updateStatusSchema),
  updateReadStatus
);
router.get(
  "/get-all",
  authenticateToken,
  // checkRole("ADMIN"),
  getAll
);

export default router;
