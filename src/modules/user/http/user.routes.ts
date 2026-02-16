import { Router } from 'express';
import { UserMySqlRepository } from '../infra/UserMySqlRepository';
import { authMiddleware } from '../../auth/AuthMiddleware';
import { requireRole } from '../../auth/RoleMiddleware';
import { UserService } from '../application/UserService';
import { BcryptPasswordHasher } from '../infra/BcryptPasswordHasher';
import { adaptExpress } from '../../../shared/http/Controller';
import { CreateUserController } from './controllers/CreateUserController';
import { UpdateCurrentUserController } from './controllers/UpdateCurrentUserController';
import { DeleteCurrentUserController } from './controllers/DeleteCurrentUserController';
import { GetUserProfileController } from './controllers/GetUserProfileController';
import { GetUserByIdController } from './controllers/GetUserByIdController';
import { ListUsersController } from './controllers/ListUsersController';

const repository = new UserMySqlRepository();
const passwordHasher = new BcryptPasswordHasher();
const service = new UserService(repository, passwordHasher);

export const userRouter = Router();

userRouter.post('/', adaptExpress(new CreateUserController(service)));
userRouter.put('/', authMiddleware, adaptExpress(new UpdateCurrentUserController(service)));
userRouter.delete('/', authMiddleware, adaptExpress(new DeleteCurrentUserController(service)));
userRouter.get('/me', authMiddleware, adaptExpress(new GetUserProfileController(service)));
userRouter.get('/:id', authMiddleware, adaptExpress(new GetUserByIdController(service)));
userRouter.get('/', authMiddleware, requireRole('admin'), adaptExpress(new ListUsersController(service)));
