import { Router } from "express";

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
    try {
        // Here you would typically handle the webhook logic
        res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
