import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest, validateCreateUser, validateLogin } from '../middleware/validation';

const router = Router();

router.post('/register', validateCreateUser, validateRequest, AuthController.register);
router.post('/login', validateLogin, validateRequest, AuthController.login);
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;