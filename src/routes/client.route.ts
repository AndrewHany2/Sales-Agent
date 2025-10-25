import { Router } from 'express';
import clientController from '../controllers/client.controller';

export const createClientRoutes = (): Router => {
  const router = Router({ mergeParams: true });
  
  router.post('/register', clientController.register);
  router.post('/login', clientController.login);
  
  return router;
};
