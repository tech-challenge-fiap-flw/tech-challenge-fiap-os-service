import { notFound } from '../../../../shared/http/HttpError';
import { IController, HttpRequest, HttpResponse } from '../../../../shared/http/Controller';
import { IVehicleService } from '../../application/VehicleService';

export class GetVehicleController implements IController {
  constructor(private readonly service: IVehicleService) {}

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const id = Number(req.params.id);

    if (!req.user) {
      throw notFound('User not found');
    }

    const found = await this.service.findById(id, req.user);

    return {
      status: 200,
      body: found
    };
  }
}
