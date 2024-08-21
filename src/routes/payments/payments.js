import { Router } from "express";
import connectedAccountRoutes from './connected_account.js';
import servicesPaymentRoutes from "./services.js";
import subscriptionRoutes from "./subscription.js";
import stripeRoutes from "./stripe_.js";

const router = Router();


router.use('/connected-account', connectedAccountRoutes);
router.use('/services', servicesPaymentRoutes);
router.use('/stripe', stripeRoutes);
router.use('/subscription', subscriptionRoutes);


export default router;
