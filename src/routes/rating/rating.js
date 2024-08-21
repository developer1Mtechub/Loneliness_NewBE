import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import { addRating, getAllRatingsForBuddy, getRatingByRequest, updateRating } from "../../controllers/rating/rating.js";
import { ratingSchema, ratingUpdateSchema } from "../../lib/validations/ratingValidation.js";

const router = express.Router();

router.post(
  "/add",
  authenticateToken,
  // checkRole("USER"),
  // validateRequest(ratingSchema),
  addRating
);
router.put(
  "/update",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(ratingUpdateSchema),
  updateRating
);
router.get(
  "/get/:request_id/service",
  authenticateToken,
  // checkRole("USER"),
  getRatingByRequest
);
router.get(
  "/get-all/buddy/:id",
  authenticateToken,
  // checkRole("BUDDY"),
  getAllRatingsForBuddy
);

export default router;
