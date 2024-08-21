import express from "express";
import {
  applyFilters,
  buddyActions,
  deleteUser,
  getAllBuddies,
  getAllUsers,
  getBlockedBuddies,
  getNearbyBuddies,
  getTotalLikes,
  getUser,
  requestToReleasePayment,
  updateProfile,
  userActions,
  getBlockedUsers,
  deleteUserPermanently,
  blockUser,
  reportedBuddies,
  reportedUsers,
  likeBuddy,
  getContactsOfUser,
  updateContactStatusByUserId,
  getMessagesUsers,
  getChatListCount,
  uploadImageInChat,
} from "../../controllers/users/users.js";
import { authenticateToken } from "../../middlewares/authMiddleware.js";
import upload from "../../middlewares/fileUploadMiddleware.js";
import {
  blockUserSchema,
  buddyActionsSchema,
  deleteUserSchema,
  likeDislikeBuddySchema,
  requestToReleasePaymentSchema,
  userActionsSchema,
} from "../../lib/validations/usersValidation.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { checkRole } from "../../middlewares/chackRoleMiddlware.js";

const router = express.Router();

router.put(
  "/update-profile",
  authenticateToken,
  upload.array("files", 10),
  updateProfile
);
router.post(
  "/get-contacts-of-users",
  // authenticateToken,
  getContactsOfUser
);
router.post(
  "/change-user-status",
  // authenticateToken,
  updateContactStatusByUserId
)
router.post(
  "/get-messages-user",
  // authenticateToken,
  getMessagesUsers
)
router.post(
  "/get-chatlist-count",
  // authenticateToken,
  getChatListCount
)
router.post(
  "/upload-image-chat",
  upload.array("files", 10),
  uploadImageInChat
)

router.get(
  "/buddy/get-near-by",
  authenticateToken,
  // checkRole("USER"),
  getNearbyBuddies
);
router.post(
  "/buddy/like",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(likeDislikeBuddySchema),
  likeBuddy
);
router.post(
  "/actions/buddy",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(userActionsSchema),
  userActions
);
router.post(
  "/actions-buddy",
  authenticateToken,
  // checkRole("USER"),
  validateRequest(buddyActionsSchema),
  buddyActions
);
router.get(
  "/block-list",
  authenticateToken,
  // checkRole("USER"),
  getBlockedBuddies
);
router.get(
  "/block-list-users",
  authenticateToken,
  // checkRole("USER"),
  getBlockedUsers
);
router.get("/get/:id", authenticateToken, getUser);
router.get("/get-likes/buddy", authenticateToken, getTotalLikes);
router.get("/get-reported/buddies", authenticateToken, reportedBuddies);
router.get("/get-reported/users", authenticateToken, reportedUsers);
router.get(
  "/get-all/users",
  authenticateToken,
  // checkRole("USER"),
  getAllUsers
);
router.get(
  "/get-all/buddies",
  authenticateToken,
  // checkRole("BUDDY"),
  getAllBuddies
);
router.get(
  "/apply-filters/buddies",
  authenticateToken,
  // checkRole("BUDDY"),
  applyFilters
);

router.post(
  "/release-payment/request",
  authenticateToken,
  // checkRole("BUDDY"),
  validateRequest(requestToReleasePaymentSchema),
  requestToReleasePayment
);

router.delete(
  "/delete/permanently",
  // authenticateToken,
  // checkRole("ADMIN"),
  validateRequest(deleteUserSchema),
  deleteUserPermanently
);

router.delete(
  "/delete",
  authenticateToken,
  // checkRole("ADMIN"),
  deleteUser
);

router.patch(
  "/block",
  authenticateToken,
  // checkRole("ADMIN"),
  validateRequest(blockUserSchema),
  blockUser
);

export default router;
