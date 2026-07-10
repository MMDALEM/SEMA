import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { codeSchema, verifySchema } from '../validators/auth.validators.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { otpRequestLimiter, otpVerifyLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login/request', otpRequestLimiter, validate(codeSchema), authController.requestOtp);
router.post('/login/verify', otpVerifyLimiter, validate(verifySchema), authController.verifyOtp);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
