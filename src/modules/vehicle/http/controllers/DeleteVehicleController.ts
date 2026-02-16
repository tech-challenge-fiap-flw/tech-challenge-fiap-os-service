import { notFound } from '../../../../shared/http/HttpError';
import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { IVehicleService } from '../../application/VehicleService';

export class DeleteVehicleController implements IController {
  constructor(private readonly service: IVehicleService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id);

    if (!req.user) {
      throw notFound('User not found');
    }

    await this.service.deleteVehicle(id, req.user);

    return {
      status: 204
    };
  }
}
