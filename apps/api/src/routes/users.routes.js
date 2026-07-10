import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import {
  createUserSchema,
  statusSchema,
  updateUserSchema,
} from '../validators/users.validators.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// ثبت‌نام کاربر فقط از پنل مدیریت انجام می‌شود
router.use(requireAuth);

router.get('/', requireRole('ADMIN'), usersController.listUsers);
router.get('/managers', requireRole('ADMIN', 'HR'), usersController.listManagers);
router.get('/seniors', requireRole('ADMIN', 'HR'), usersController.listSeniorManagers);
router.post('/', requireRole('ADMIN'), validate(createUserSchema), usersController.createUser);
router.patch('/:id', requireRole('ADMIN'), validate(updateUserSchema), usersController.updateUser);
router.patch('/:id/status', requireRole('ADMIN'), validate(statusSchema), usersController.setUserStatus);
router.post('/:id/regenerate-code', requireRole('ADMIN'), usersController.regenerateCode);

export default router;
