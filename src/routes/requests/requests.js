import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import {
  actionBuddy,
  actionBuddyv2,
  actionUser,
  getAllBuddyRequest,
  getAllRejectedPaymentRequests,
  getAllUserRequest,
  getOneRequest,
  getOneRequestBuddy,
  requestBack,
  sendRequest,
  sendRequestv2,
  verifyMeetingCode
} from "../../controllers/requests/requests.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  actionRequestSchema,
  requestBackSchema,
  sendRequestSchema,
  userActionRequestSchema,
} from "../../lib/validations/requestValidation.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";

const router = express.Router();

router.post(
  "/send/user",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(sendRequestSchema),
  sendRequest
);
router.post(
  "/sendv2/user",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(sendRequestSchema),
  sendRequestv2
);
router.post(
  "/verify-meeting-code",
  // authenticateToken,
  // checkRole("USER"),
  // validateRequest(verifyMeetingCodeSchema),
  verifyMeetingCode
);
router.patch(
  "/actions/buddy",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(actionRequestSchema),
  actionBuddy
);
router.patch(
  "/actionsv2/buddy",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(actionRequestSchema),
  actionBuddyv2
);

router.post(
  "/request-back/buddy",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(requestBackSchema),
  requestBack
);
router.patch(
  "/actions/user",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(userActionRequestSchema),
  actionUser
);
router.get(
  "/getAll/user",
  authenticateToken,
  // checkRole("USER"),
  getAllUserRequest
);
router.get(
  "/get/:id",
  authenticateToken,
  // checkRole("USER"),
  getOneRequest
);
router.get(
  "/get-buddy/:id",
  authenticateToken,
  // checkRole("USER"),
  getOneRequestBuddy
);
router.get(
  "/getAll/buddy",
  authenticateToken,
  // checkRole("BUDDY"),
  getAllBuddyRequest
);
router.get(
  "/rejected-payments/get-all",
  authenticateToken,
  // checkRole("BUDDY"),
  getAllRejectedPaymentRequests
);

export default router;
