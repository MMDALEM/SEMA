import { Router } from 'express';
import * as requestsController from '../controllers/requests.controller.js';
import {
  createRequestSchema,
  decideRequestSchema,
  seniorDecideSchema,
} from '../validators/requests.validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate(createRequestSchema), requestsController.createRequest);
router.get('/mine', requestsController.myRequests);
router.patch('/:id/cancel', requestsController.cancelRequest);
router.get(
  '/senior-inbox',
  requireRole('SITE_MANAGER', 'GENERAL_MANAGER'),
  requestsController.seniorInbox
);
router.patch(
  '/:id/senior-decision',
  requireRole('SITE_MANAGER', 'GENERAL_MANAGER'),
  validate(seniorDecideSchema),
  requestsController.seniorDecideRequest
);
router.get('/', requireRole('FINANCE', 'HR'), requestsController.inbox);
router.patch(
  '/:id/decide',
  requireRole('FINANCE', 'HR'),
  validate(decideRequestSchema),
  requestsController.decideRequest
);

export default router;
