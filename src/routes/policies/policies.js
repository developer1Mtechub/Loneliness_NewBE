import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { getPolicies, togglePolicies } from "../../controllers/polices/policies.js";
import { policesSchema } from "../../lib/validations/policiesValidation.js";

const router = express.Router();

router.post(
  "/toggle-policies",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(policesSchema),
  togglePolicies
);
router.get(
  "/get/:type",
  authenticateToken,
  // checkRole("USER"),
  getPolicies
);

export default router;
