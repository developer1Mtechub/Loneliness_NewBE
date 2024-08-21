import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { attachPaymentMethodToCustomer, createCustomer } from "../../controllers/payments/stripe_.js";
import { attachPaymentSchema } from "../../lib/validations/paymentValidation.js";

const router = express.Router();

router.post(
  "/create-customer",
  authenticateToken,
  // checkRole("USER"),
  createCustomer
);

router.post(
  "/attach-payment-method",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(attachPaymentSchema),
  attachPaymentMethodToCustomer
);

export default router;
