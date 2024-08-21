import express from "express";
import {
  addCategory,
  deleteAllCategory,
  deleteCategory,
  getAllCategory,
  getCategory,
  updateCategory,
} from "../../controllers/categories/categories.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import upload from "../../middlewares/fileUploadMiddleware.js";

const router = express.Router();

router.post(
  "/add",
  authenticateToken,
  // checkRole("ADMIN"),
  upload.single("image"),
  addCategory
);
router.put(
  "/update",
  authenticateToken,
  // checkRole("ADMIN"),
  // validateRequest(roleUpdateSchema),
  upload.single("image"),
  updateCategory
);
router.get("/get/:id", authenticateToken, getCategory);
router.get("/getAll", authenticateToken, getAllCategory);
router.delete(
  "/delete/:id",
  authenticateToken,
  // checkRole("ADMIN"),
  deleteCategory
);
router.delete(
  "/deleteAll",
  authenticateToken,
  // checkRole("ADMIN"),
  deleteAllCategory
);

export default router;
