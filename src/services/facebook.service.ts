import { Request, Response } from 'express';

function verifyFacebookWebhook(req: Request) {
    try {
        const VERIFY_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified!');
            return challenge;
        } else {
            return false; // Forbidden
        }

    } catch (error) {
        return error;
    }
}
export default { verifyFacebookWebhook }