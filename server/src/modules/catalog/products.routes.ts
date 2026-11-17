import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { create, detail, list, remove, update } from './products.controller.js';

export const productsRouter = Router();

productsRouter.use(authenticate);
productsRouter.get('/', list);
productsRouter.post('/', create);
productsRouter.get('/:id', detail);
productsRouter.patch('/:id', update);
productsRouter.delete('/:id', remove);
