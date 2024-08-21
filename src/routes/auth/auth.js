import express from "express";
import {
  changePassword,
    forgotPassword,
    login,
  refreshToken,
  register,
  resetPassword,
  verifyCode,
} from "../../controllers/auth/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { changPasswordSchema, forgotPasswordSchema, loginSchema, refreshTokenSchema, registerSchema, resetPasswordSchema, verifyCodeSchema } from "../../lib/validations/authValidation.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/sign-in", validateRequest(loginSchema), login);
router.post("/refresh-token", validateRequest(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/verify-code", validateRequest(verifyCodeSchema), verifyCode);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPassword
);
router.post(
  "/change-password",
  authenticateToken,
  validateRequest(changPasswordSchema),
  changePassword
);


export default router;
