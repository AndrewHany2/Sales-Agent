import { Router } from "express";
import { PlatformManager } from "../services/platformManager.service";
import { MessageBus } from "../services/messageBus.service";
import { createWebhookRoutes } from "./webhook.route";
import { createApiRoutes } from "./api.route";

export const createRoutes = (
  platformManager: PlatformManager,
  messageBus: MessageBus
): Router => {
  const router = Router();

  router.use("/webhook", createWebhookRoutes(platformManager));
  router.use("/api", createApiRoutes(platformManager, messageBus));

  return router;
};
