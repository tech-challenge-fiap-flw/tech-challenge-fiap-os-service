import { Router } from 'express';
import { authMiddleware } from '../../auth/AuthMiddleware';
import { adaptExpress } from '../../../shared/http/Controller';
import { VehicleMySqlRepository } from '../infra/VehicleMySqlRepository';
import { VehicleService } from '../application/VehicleService';
import { CreateVehicleController } from './controllers/CreateVehicleController';
import { GetVehicleController } from './controllers/GetVehicleController';
import { UpdateVehicleController } from './controllers/UpdateVehicleController';
import { DeleteVehicleController } from './controllers/DeleteVehicleController';
import { ListVehiclesController } from './controllers/ListVehiclesController';
import { UserMySqlRepository } from '../../../modules/user/infra/UserMySqlRepository';
import { UserService } from '../../../modules/user/application/UserService';
import { BcryptPasswordHasher } from '../../../modules/user/infra/BcryptPasswordHasher';

const userRepository = new UserMySqlRepository();
const userPasswordHasher = new BcryptPasswordHasher();
const userService = new UserService(userRepository, userPasswordHasher);

const repository = new VehicleMySqlRepository();
const service = new VehicleService(repository, userService);

export const vehicleRouter = Router();

vehicleRouter.post('/', authMiddleware, adaptExpress(new CreateVehicleController(service)));
vehicleRouter.get('/:id', authMiddleware, adaptExpress(new GetVehicleController(service)));
vehicleRouter.put('/:id', authMiddleware, adaptExpress(new UpdateVehicleController(service)));
vehicleRouter.delete('/:id', authMiddleware, adaptExpress(new DeleteVehicleController(service)));
vehicleRouter.get('/', authMiddleware, adaptExpress(new ListVehiclesController(service)));
