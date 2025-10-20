import { Router } from "express";
import webhookRoutes from "./webhook.route";
import userRoutes from "./user.route";
import loginRoutes from "./login.route";

const router = Router({ mergeParams: true });

router.use("/webhook", webhookRoutes);
router.use("/user", userRoutes);
router.use("/auth", loginRoutes);

export default router;
