import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import { get, toggleCommission } from "../../controllers/commission/commission.js";
import { addCommissionSchema } from "../../lib/commissionValidation.js";

const router = express.Router();

router.post(
  "/toggle/add-update",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(addCommissionSchema),
  toggleCommission
);

router.get(
  "/get",
  authenticateToken,
  // checkRole("USER"),
  get
);

export default router;
