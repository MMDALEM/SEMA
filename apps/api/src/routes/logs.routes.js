import { Router } from 'express';
import * as logsController from '../controllers/logs.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN'), logsController.listLogs);

export default router;
