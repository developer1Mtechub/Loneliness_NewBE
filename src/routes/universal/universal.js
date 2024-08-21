import express from "express";
import {
  addRole,
  updateRole,
  getAllRoles,
  deleteRole,
  deleteAllRoles,
  getAllCountriesWIthPhoneCode,
  getAllLanguages,
  getTotals,
  monthlyAdminTransactions,
  yearlyAdminTransactions,
  getUsersRequest,
} from "../../controllers/universal/universal.js";
import {
  roleSchema,
  roleUpdateSchema,
} from "../../lib/validations/roleValidation.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";
import { getAllDeletedUsers } from "../../controllers/users/users.js";

const router = express.Router();

router.post(
  "/roles/add",
  // authenticateToken,
  // checkRole("ADMIN"),
  validateRequest(roleSchema),
  addRole
);
router.put(
  "/roles/update",
  // authenticateToken,
  // checkRole("ADMIN"),
  validateRequest(roleUpdateSchema),
  updateRole
);
router.get(
  "/roles/getAll",
  // authenticateToken,
  // checkRole("ADMIN"),
  getAllRoles
);
router.delete(
  "/roles/delete/:id",
  // authenticateToken,
  // checkRole("ADMIN"),
  deleteRole
);
router.delete(
  "/roles/deleteAll",
  // authenticateToken,
  // checkRole("ADMIN"),
  deleteAllRoles
);

router.get(
  "/countries/getAllWIthPhoneCode",
  authenticateToken,
  getAllCountriesWIthPhoneCode
);
router.get("/languages/getAll", authenticateToken, getAllLanguages);
router.get("/users/count", authenticateToken, getTotals);
router.get("/users/deleted", authenticateToken, getAllDeletedUsers);
router.get("/admin/transactions/monthly", authenticateToken, monthlyAdminTransactions);
router.get("/admin/transactions/yearly", authenticateToken, yearlyAdminTransactions);
router.get("/users/requests/:user_id", authenticateToken, getUsersRequest);
export default router;
