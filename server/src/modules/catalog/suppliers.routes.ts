import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { create, detail, list, remove, update } from './suppliers.controller.js';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);
suppliersRouter.get('/', list);
suppliersRouter.post('/', create);
suppliersRouter.get('/:id', detail);
suppliersRouter.patch('/:id', update);
suppliersRouter.delete('/:id', remove);
