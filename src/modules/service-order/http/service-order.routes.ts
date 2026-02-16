import { Router } from 'express';
import { authMiddleware } from '../../auth/AuthMiddleware';
import { adaptExpress } from '../../../shared/http/Controller';
import { ServiceOrderMySqlRepository } from '../infra/ServiceOrderMySqlRepository';
import { ServiceOrderService } from '../application/ServiceOrderService';
import { CreateServiceOrderController } from './controllers/CreateServiceOrderController';
import { DiagnosisMySqlRepository } from '../../../modules/diagnosis/infra/DiagnosisMySqlRepository';
import { DiagnosisService } from '../../../modules/diagnosis/application/DiagnosisService';
import { VehicleMySqlRepository } from '../../../modules/vehicle/infra/VehicleMySqlRepository';
import { VehicleService } from '../../../modules/vehicle/application/VehicleService';
import { UserMySqlRepository } from '../../../modules/user/infra/UserMySqlRepository';
import { UserService } from '../../../modules/user/application/UserService';
import { BcryptPasswordHasher } from '../../../modules/user/infra/BcryptPasswordHasher';
import { AcceptServiceOrderController } from './controllers/AcceptServiceOrderController';
import { StartRepairServiceOrderController } from './controllers/StartRepairServiceOrderController';
import { FinishRepairServiceOrderController } from './controllers/FinishRepairServiceOrderController';
import { DeliveredServiceOrderController } from './controllers/DeliveredServiceOrderController';
import { DeleteServiceOrderController } from './controllers/DeleteServiceOrderController';
import { GetServiceOrderController } from './controllers/GetServiceOrderController';
import { ServiceOrderHistoryMongoRepository } from '../../../modules/service-order-history/infra/ServiceOrderHistoryMongoRepository';
import { ServiceOrderHistoryService } from '../../../modules/service-order-history/application/ServiceOrderHistoryService';
import { NodemailerEmailService } from '../../../shared/mail/NodemailerEmailService';
import { AcceptBudgetServiceOrderController } from './controllers/AcceptBudgetServiceOrderController';
import { ExecutionTimeServiceOrderController } from './controllers/ExecutionTimeServiceOrderController';
import { AverageExecutionTimeServiceOrderController } from './controllers/AverageExecutionTimeServiceOrderController';
import { requireRole } from '../../../modules/auth/RoleMiddleware';
import { SqsPublisher } from '../../../infra/messaging/SqsPublisher';

const userRepository = new UserMySqlRepository();
const userPasswordHasher = new BcryptPasswordHasher();
const userService = new UserService(userRepository, userPasswordHasher);

const vehicleRepository = new VehicleMySqlRepository();
const vehicleService = new VehicleService(vehicleRepository, userService);

const diagnosisRepository = new DiagnosisMySqlRepository();
const diagnosisService = new DiagnosisService(diagnosisRepository, vehicleService, userService);

const historyRepository = new ServiceOrderHistoryMongoRepository();
const emailService = new NodemailerEmailService();
const serviceOrderRepoForHistory = new ServiceOrderMySqlRepository();
const historyService = new ServiceOrderHistoryService(historyRepository, emailService, serviceOrderRepoForHistory, userRepository);

const sqsPublisher = process.env.SQS_QUEUE_URL
  ? new SqsPublisher(process.env.SQS_QUEUE_URL)
  : undefined;

const repository = new ServiceOrderMySqlRepository();
const service = new ServiceOrderService(
  repository,
  diagnosisService,
  historyService,
  sqsPublisher,
);

export const serviceOrderRouter = Router();

serviceOrderRouter.post('/', authMiddleware, adaptExpress(new CreateServiceOrderController(service)));
serviceOrderRouter.delete('/:id', authMiddleware, requireRole('admin'), adaptExpress(new DeleteServiceOrderController(service)));
serviceOrderRouter.get('/:id', authMiddleware, adaptExpress(new GetServiceOrderController(service)));
serviceOrderRouter.post('/:id/accept', authMiddleware, requireRole('admin'), adaptExpress(new AcceptServiceOrderController(service)));
serviceOrderRouter.post('/:id/start', authMiddleware, requireRole('admin'), adaptExpress(new StartRepairServiceOrderController(service)));
serviceOrderRouter.post('/:id/finish', authMiddleware, requireRole('admin'), adaptExpress(new FinishRepairServiceOrderController(service)));
serviceOrderRouter.post('/:id/delivered', authMiddleware, adaptExpress(new DeliveredServiceOrderController(service)));
serviceOrderRouter.post('/:id/accept-budget', authMiddleware, adaptExpress(new AcceptBudgetServiceOrderController(service)));
serviceOrderRouter.get('/:id/execution-time', authMiddleware, requireRole('admin'), adaptExpress(new ExecutionTimeServiceOrderController(service)));
serviceOrderRouter.get('/execution-time/average', authMiddleware, requireRole('admin'), adaptExpress(new AverageExecutionTimeServiceOrderController(service)));
