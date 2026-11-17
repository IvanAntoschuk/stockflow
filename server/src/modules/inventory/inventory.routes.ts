import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { list } from './inventory.controller.js';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);
inventoryRouter.get('/', list);
