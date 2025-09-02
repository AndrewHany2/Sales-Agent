import facebookService from "../services/facebook.service";
import prisma from "../services/prisma.service";
import { Request, Response } from "express";

async function verifyFacebookWebhook(req: Request, res: Response) {
    try {
        const response = await facebookService.verifyFacebookWebhook(req);
        if (response) res.status(200).send(response); // Respond with the challenge token
        else res.sendStatus(403)
    } catch (error: unknown) {
        res.status(500).send(error)
    }

}


export default { verifyFacebookWebhook };
