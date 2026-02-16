import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { createVehicleSchema } from './schemas';
import { IVehicleService } from '../../application/VehicleService';

export class CreateVehicleController implements IController {
  constructor(private readonly service: IVehicleService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const parsed = createVehicleSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    const created = await this.service.createVehicle(parsed.data as any);

    return {
      status: 201,
      body: created
    };
  }
}
