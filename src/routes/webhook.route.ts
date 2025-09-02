import { Router } from "express";
import webhookController from "../controllers/webhook.controller";

const router = Router({ mergeParams: true });

router.get('/', webhookController.verifyFacebookWebhook);

router.post('/', (req, res) => {
    const body = req.body;

    // Check if this is a page subscription
    if (body.object === 'page') {
        body.entry.forEach((entry: any) => {
            // Get the message details
            const webhookEvent = entry.messaging[0];
            console.log('Incoming message:', webhookEvent);

            // Extract sender ID and message text
            const senderId = webhookEvent.sender.id;
            const message = webhookEvent.message.text;

            console.log(`Message from ${senderId}: ${message}`);

            // You can now process the message or send a response
        });

        // Respond to Facebook to acknowledge receipt of the event
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Return a 404 if the event is not from a page subscription
        res.sendStatus(404);
    }
});

export default router;
