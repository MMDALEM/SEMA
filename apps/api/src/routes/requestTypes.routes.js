import { Router } from 'express';
import * as requestTypesController from '../controllers/requestTypes.controller.js';
import { typeSchema, typeUpdateSchema } from '../validators/requestTypes.validators.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', requestTypesController.listTypes);
router.post('/', validate(typeSchema), requestTypesController.createType);
router.patch('/:id', validate(typeUpdateSchema), requestTypesController.updateType);
router.delete('/:id', requestTypesController.deactivateType);

export default router;
