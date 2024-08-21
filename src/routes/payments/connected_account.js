import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import {
    checkRequirements,
  createConnectedAccount,
  onboardingAccount,
} from "../../controllers/payments/accounted_account.js";

const router = express.Router();

router.post(
  "/create",
  authenticateToken,
  // checkRole("BUDDY"),
  createConnectedAccount
);
router.post(
  "/onboarding",
  authenticateToken,
  // checkRole("BUDDY"),
  onboardingAccount
);
router.post(
  "/check-requirement/status",
  authenticateToken,
  // checkRole("BUDDY"),
  checkRequirements
);

export default router;
