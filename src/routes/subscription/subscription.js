import express from "express";
import {
  addSubscription,
  deleteSubscription,
  getAllSubscriptionTransactions,
  getAllSubscriptions,
  getOneSubscription,
  getWallet,
} from "../../controllers/subscription/subscription.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  addOrUpdateSub,
  getTransactionsSchema,
} from "../../lib/validations/subscriptionValidation.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/add-update",
  authenticateToken,
  //   checkRole("ADMIN"),
  validateRequest(addOrUpdateSub),
  addSubscription
);
router.delete(
  "/delete/:id",
  authenticateToken,
  //   checkRole("ADMIN"),
  deleteSubscription
);
router.get(
  "/get-all",
  authenticateToken,
  //   checkRole("ADMIN"),
  getAllSubscriptions
);
router.get(
  "/get/:id",
  authenticateToken,
  //   checkRole("ADMIN"),
  getOneSubscription
);
router.get(
  "/get-subscription/transactions",
  authenticateToken,
  // validateRequest(getTransactionsSchema),
  //   checkRole("ADMIN"),
  getAllSubscriptionTransactions
);
router.get(
  "/get-wallet",
  authenticateToken,
  //   checkRole("ADMIN"),
  getWallet
);

export default router;
