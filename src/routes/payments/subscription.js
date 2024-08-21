import express from "express";
import { cancelSubscription, getActiveSubscription, paySubscription } from "../../controllers/payments/subscription.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { paySubValidation } from "../../lib/validations/subscriptionValidation.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post(
  "/subscribe",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(paySubValidation),
  paySubscription
);
router.post(
  "/cancel",
  authenticateToken,
  // checkRole("USER"),
  cancelSubscription
);
router.get(
  "/get-active",
  authenticateToken,
  // checkRole("USER"),
  getActiveSubscription
);

export default router;
