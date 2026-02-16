import { notFound } from '../../../../shared/http/HttpError';
import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { badRequest } from '../../../../shared/http/HttpError';
import { IVehicleService } from '../../application/VehicleService';
import { updateVehicleSchema } from './schemas';

export class UpdateVehicleController implements IController {
  constructor(private readonly service: IVehicleService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id);

    const parsed = updateVehicleSchema.safeParse(req.body);

    if (!parsed.success) {
      throw badRequest('Validation failed', parsed.error.format());
    }

    if (!req.user) {
      throw notFound('User not found');
    }

    const updated = await this.service.updateVehicle(id, parsed.data, req.user);

    return {
      status: 200,
      body: updated
    };
  }
}
