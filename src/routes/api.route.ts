import { Router } from "express";
import webhookRoutes from "./webhook.route";
const router = Router({ mergeParams: true });

router.use('/webhook', webhookRoutes);

export default router;
