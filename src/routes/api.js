import express from "express";
import universalRoutes from "./universal/universal.js";
import authRoutes from "./auth/auth.js";
import categoriesRoutes from "./categories/categories.js";
import usersRoutes from "./users/users.js";
import requestsRoutes from "./requests/requests.js";
import paymentsRoutes from "./payments/payments.js";
import ratingRoutes from "./rating/rating.js";
import subscriptionRoutes from "./subscription/subscription.js";
import notificationsRoutes from "./notifications/notifications.js";
import commissionRoutes from "./commission/commission.js";
import policiesRoutes from "./policies/policies.js";
import socialLinksRoutes from "./social_links/social_links.js";

const router = express.Router();

router.use("/universal", universalRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/users", usersRoutes);
router.use("/requests", requestsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/rating", ratingRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/commission", commissionRoutes);
router.use("/policies", policiesRoutes);
router.use("/social-links", socialLinksRoutes);

export default router;
