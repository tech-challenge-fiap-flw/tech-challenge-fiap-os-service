import { NotFoundServerException } from '../../../shared/application/ServerException';
import { IUserService } from '../../../modules/user/application/UserService';
import { IVehicleService } from '../../../modules/vehicle/application/VehicleService';
import { DiagnosisEntity, IDiagnosisProps } from '../domain/Diagnosis';
import { IDiagnosisRepository } from '../domain/IDiagnosisRepository';

export type CreateDiagnosisInput = Omit<IDiagnosisProps, 'id' | 'creationDate' | 'deletedAt'>;
export type DiagnosisOutput = ReturnType<DiagnosisEntity['toJSON']>;

export interface IDiagnosisService  {
  create(input: CreateDiagnosisInput): Promise<DiagnosisOutput>;
  updateDiagnosis(id: number, partial: Partial<CreateDiagnosisInput>): Promise<DiagnosisOutput>;
  deleteDiagnosis(id: number): Promise<void>;
  findById(id: number): Promise<DiagnosisOutput>;
  list(offset: number, limit: number): Promise<DiagnosisOutput[]>;
  countAll(): Promise<number>;
}

export class DiagnosisService implements IDiagnosisService {
  constructor(
    private readonly repo: IDiagnosisRepository,
    private readonly vehicleService: IVehicleService,
    private readonly userService: IUserService,
  ) {}

  async create(input: CreateDiagnosisInput): Promise<DiagnosisOutput> {
    return this.repo.transaction(async () => {
      await this.vehicleService.findById(input.vehicleId);

      if (input.mechanicId) {
        await this.userService.findById(input.mechanicId);
      }

      const entity = DiagnosisEntity.create(input);
      const created = await this.repo.create(entity);
      return created.toJSON();
    })
  }

  async updateDiagnosis(id: number, partial: Partial<CreateDiagnosisInput>): Promise<DiagnosisOutput> {
    await this.findById(id);
    const updated = await this.repo.update(id, partial);
    return updated.toJSON();
  }

  async deleteDiagnosis(id: number): Promise<void> {
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async findById(id: number): Promise<DiagnosisOutput> {
    const diagnosis = await this.repo.findById(id as any);

    if (!diagnosis) {
      throw new NotFoundServerException('Diagnosis not found');
    }

    return diagnosis.toJSON();
  }

  async list(offset: number, limit: number): Promise<DiagnosisOutput[]> {
    const items = await this.repo.list(offset, limit);
    return items.map(i => i.toJSON());
  }

  async countAll(): Promise<number> {
    return this.repo.countAll();
  }
}
