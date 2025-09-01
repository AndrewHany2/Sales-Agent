import { Router } from "express";
import webhookRoutes from "./webhook.route";
import userRoutes from "./user.route";

const router = Router({ mergeParams: true });

router.use('/webhook', webhookRoutes);
router.use('/user', userRoutes);

export default router;
