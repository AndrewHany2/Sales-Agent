import { Router } from 'express';
import userController from '../controllers/user.controller';

const router = Router({ mergeParams: true });

router.post('/register', userController.register);

export default router;
