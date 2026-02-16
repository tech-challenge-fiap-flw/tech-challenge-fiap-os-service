import { Router } from 'express';
import { adaptExpress } from '../../shared/http/Controller';
import { UserMySqlRepository } from '../user/infra/UserMySqlRepository';
import { LoginController } from './controllers/LoginController';
import { UserService } from '../user/application/UserService';
import { BcryptPasswordHasher } from '../user/infra/BcryptPasswordHasher';

const repo = new UserMySqlRepository();
const userPasswordHasher = new BcryptPasswordHasher();
const service = new UserService(repo, userPasswordHasher);

export const authRouter = Router();

authRouter.post('/login', adaptExpress(new LoginController(service)));
