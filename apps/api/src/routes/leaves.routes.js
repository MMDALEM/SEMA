import { Router } from 'express';
import * as leavesController from '../controllers/leaves.controller.js';
import { leaveDecideSchema, leaveSchema } from '../validators/leaves.validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate(leaveSchema), leavesController.createLeave);
router.get('/mine', leavesController.myLeaves);
router.get(
  '/inbox',
  requireRole('MANAGER', 'SITE_MANAGER', 'GENERAL_MANAGER', 'HR'),
  leavesController.leavesInbox
);
router.patch('/:id/cancel', leavesController.cancelLeave);
router.patch(
  '/:id/manager-decision',
  requireRole('MANAGER'),
  validate(leaveDecideSchema),
  leavesController.managerDecision
);
router.patch(
  '/:id/senior-decision',
  requireRole('SITE_MANAGER', 'GENERAL_MANAGER'),
  validate(leaveDecideSchema),
  leavesController.seniorDecision
);
router.patch(
  '/:id/hr-decision',
  requireRole('HR'),
  validate(leaveDecideSchema),
  leavesController.hrDecision
);
router.patch('/:id', validate(leaveSchema), leavesController.updateLeave);

export default router;
