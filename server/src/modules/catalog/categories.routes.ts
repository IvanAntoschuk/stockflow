import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { create, detail, list, remove, update } from './categories.controller.js';

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);
categoriesRouter.get('/', list);
categoriesRouter.post('/', create);
categoriesRouter.get('/:id', detail);
categoriesRouter.patch('/:id', update);
categoriesRouter.delete('/:id', remove);
