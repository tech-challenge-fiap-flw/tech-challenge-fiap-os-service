import { Router } from 'express';
import { adaptExpress } from '../../../shared/http/Controller';
import { authMiddleware } from '../../auth/AuthMiddleware';
import { ServiceOrderHistoryMongoRepository } from '../infra/ServiceOrderHistoryMongoRepository';
import { ServiceOrderHistoryService } from '../application/ServiceOrderHistoryService';
import { NodemailerEmailService } from '../../../shared/mail/NodemailerEmailService';
import { ServiceOrderMySqlRepository } from '../../service-order/infra/ServiceOrderMySqlRepository';
import { UserMySqlRepository } from '../../user/infra/UserMySqlRepository';
import { LogServiceOrderHistoryController } from './controllers/LogServiceOrderHistoryController';
import { ListServiceOrderHistoryController } from './controllers/ListServiceOrderHistoryController';
import { requireRole } from '../../../modules/auth/RoleMiddleware';

const repository = new ServiceOrderHistoryMongoRepository();
const emailService = new NodemailerEmailService();
const serviceOrderRepo = new ServiceOrderMySqlRepository();
const userRepo = new UserMySqlRepository();
const service = new ServiceOrderHistoryService(repository, emailService, serviceOrderRepo, userRepo);

export const serviceOrderHistoryRouter = Router();

serviceOrderHistoryRouter.post('/', authMiddleware, requireRole('admin'), adaptExpress(new LogServiceOrderHistoryController(service)));
serviceOrderHistoryRouter.get('/:idServiceOrder', authMiddleware, requireRole('admin'), adaptExpress(new ListServiceOrderHistoryController(service)));
