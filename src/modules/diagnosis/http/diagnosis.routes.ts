import { Router } from 'express';
import { authMiddleware } from '../../auth/AuthMiddleware';
import { adaptExpress } from '../../../shared/http/Controller';
import { DiagnosisMySqlRepository } from '../infra/DiagnosisMySqlRepository';
import { DiagnosisService } from '../application/DiagnosisService';
import { CreateDiagnosisController } from './controllers/CreateDiagnosisController';
import { GetDiagnosisController } from './controllers/GetDiagnosisController';
import { UpdateDiagnosisController } from './controllers/UpdateDiagnosisController';
import { DeleteDiagnosisController } from './controllers/DeleteDiagnosisController';
import { ListDiagnosesController } from './controllers/ListDiagnosesController';
import { VehicleMySqlRepository } from '../../../modules/vehicle/infra/VehicleMySqlRepository';
import { VehicleService } from '../../../modules/vehicle/application/VehicleService';
import { UserMySqlRepository } from '../../../modules/user/infra/UserMySqlRepository';
import { UserService } from '../../../modules/user/application/UserService';
import { BcryptPasswordHasher } from '../../../modules/user/infra/BcryptPasswordHasher';
import { requireRole } from '../../../modules/auth/RoleMiddleware';

const userRepository = new UserMySqlRepository();
const userPasswordHasher = new BcryptPasswordHasher();
const userService = new UserService(userRepository, userPasswordHasher);

const repositoryVehicle = new VehicleMySqlRepository();
const serviceVehicle = new VehicleService(repositoryVehicle, userService);

const repository = new DiagnosisMySqlRepository();
const service = new DiagnosisService(repository, serviceVehicle, userService);

export const diagnosisRouter = Router();

diagnosisRouter.post('/', authMiddleware, requireRole('admin'), adaptExpress(new CreateDiagnosisController(service)));
diagnosisRouter.get('/:id', authMiddleware, requireRole('admin'), adaptExpress(new GetDiagnosisController(service)));
diagnosisRouter.put('/:id', authMiddleware, requireRole('admin'), adaptExpress(new UpdateDiagnosisController(service)));
diagnosisRouter.delete('/:id', authMiddleware, requireRole('admin'), adaptExpress(new DeleteDiagnosisController(service)));
diagnosisRouter.get('/', authMiddleware, requireRole('admin'), adaptExpress(new ListDiagnosesController(service)));
