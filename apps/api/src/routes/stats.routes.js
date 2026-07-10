import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, statsController.getStats);

export default router;
