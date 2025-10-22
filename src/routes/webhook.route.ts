import { Router, Request, Response } from "express";
import { PlatformManager } from "../services/platformManager.service";
import { config } from "../config";

export const createWebhookRoutes = (
  platformManager: PlatformManager
): Router => {
  const router = Router();

  // Facebook & Instagram webhook verification
  router.get("/facebook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === config.platforms.facebook.verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  router.post("/facebook", (req: Request, res: Response) => {
    platformManager.handleWebhook("facebook", req.body);
    res.sendStatus(200);
  });

  router.post("/instagram", (req: Request, res: Response) => {
    platformManager.handleWebhook("instagram", req.body);
    res.sendStatus(200);
  });

  // Telegram webhook
  router.post("/telegram", (req: Request, res: Response) => {
    platformManager.handleWebhook("telegram", req.body);
    res.sendStatus(200);
  });

  // WhatsApp webhook
  router.get("/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === config.platforms.facebook.verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  router.post("/whatsapp", (req: Request, res: Response) => {
    platformManager.handleWebhook("whatsapp", req.body);
    res.sendStatus(200);
  });

  // Slack webhook
  router.post("/slack", (req: Request, res: Response) => {
    if (req.body.type === "url_verification") {
      return res.json({ challenge: req.body.challenge });
    }
    platformManager.handleWebhook("slack", req.body);
    res.sendStatus(200);
  });

  // Twitter webhook
  router.post("/twitter", (req: Request, res: Response) => {
    platformManager.handleWebhook("twitter", req.body);
    res.sendStatus(200);
  });

  return router;
};
