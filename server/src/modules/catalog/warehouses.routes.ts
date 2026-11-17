import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { create, detail, list, remove, update } from './warehouses.controller.js';

export const warehousesRouter = Router();

warehousesRouter.use(authenticate);
warehousesRouter.get('/', list);
warehousesRouter.post('/', create);
warehousesRouter.get('/:id', detail);
warehousesRouter.patch('/:id', update);
warehousesRouter.delete('/:id', remove);
