import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { reportSchema, seenSchema } from '../validators/reports.validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate(reportSchema), reportsController.createReport);
router.get('/mine', reportsController.myReports);
router.get('/team', requireRole('MANAGER'), reportsController.teamReports);
router.patch('/:id/seen', requireRole('MANAGER'), validate(seenSchema), reportsController.markSeen);

export default router;
