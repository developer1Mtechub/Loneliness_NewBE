import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  cancelPaymentRequest,
  cancelPaymentActions,
  getUserCards,
  releasePayment,
  releasePaymentByAdmin,
  transferPayment,
  withdraw,
  getUserTransactions,
  checkChatPayment,
} from "../../controllers/payments/services.js";
import { cancelPaymentActionSchema, cancelPaymentSchema, releasePaymentByAdminSchema, releasePaymentSchema, transferPaymentSchema, withdrawSchema } from "../../lib/validations/paymentValidation.js";
import { deleteUserSchema } from "../../lib/validations/usersValidation.js";

const router = express.Router();

router.post(
  "/transfer-payment",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(transferPaymentSchema),
  transferPayment
);
router.post(
  "/release-payment",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(releasePaymentSchema),
  releasePayment
);
router.post(
  "/cancel-payment/request",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(cancelPaymentSchema),
  cancelPaymentRequest
);
router.post(
  "/cancel-payment/actions",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(cancelPaymentActionSchema),
  cancelPaymentActions
);
router.post(
  "/release-payment-user/admin",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(releasePaymentByAdminSchema),
  releasePaymentByAdmin
);
router.post(
  "/withdraw/buddy",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(withdrawSchema),
  withdraw
);
router.get(
  "/get/cards",
  authenticateToken,
  // checkRole("BUDDY"),
  getUserCards
);
router.get(
  "/get-transactions",
  authenticateToken,
  // checkRole("BUDDY"),
  getUserTransactions
);
router.post(
  "/chat-payment/status",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(deleteUserSchema),
  checkChatPayment
);

export default router;
