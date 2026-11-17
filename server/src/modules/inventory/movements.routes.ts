import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { create, detail, list, transfer } from './movements.controller.js';

export const movementsRouter = Router();

movementsRouter.use(authenticate);
movementsRouter.get('/', list);
movementsRouter.get('/:id', detail);
movementsRouter.post('/', create);
movementsRouter.post('/transfer', transfer);
