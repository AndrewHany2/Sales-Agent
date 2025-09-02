import { Router } from "express";

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
    try {
        const VERIFY_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified!');
            res.status(200).send(challenge); // Respond with the challenge token
        } else {
            res.sendStatus(403); // Forbidden
        }

    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

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
