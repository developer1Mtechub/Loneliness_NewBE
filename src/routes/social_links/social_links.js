import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import { addLinks, deleteLink, getAllLinks } from "../../controllers/social_links/social_links.js";
import { addLinksSchema } from "../../lib/validations/socialLinksValidation.js";

const router = express.Router();

router.post(
  "/add",
  authenticateToken,
  // checkRole("ADMIN"),
  validateRequest(addLinksSchema),
  addLinks
);
router.get(
  "/get-all",
  authenticateToken,
  // checkRole("ADMIN"),
  getAllLinks
);
router.delete(
  "/delete/:id",
  authenticateToken,
  // checkRole("ADMIN"),
  deleteLink
);

export default router;
