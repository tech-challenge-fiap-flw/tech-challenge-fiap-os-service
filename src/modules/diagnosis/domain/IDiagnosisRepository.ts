import { IBaseRepository } from '../../../shared/domain/BaseRepository';
import { DiagnosisEntity, DiagnosisId, IDiagnosisProps } from './Diagnosis';

export interface IDiagnosisRepository extends IBaseRepository {
  create(entity: DiagnosisEntity): Promise<DiagnosisEntity>;
  findById(id: DiagnosisId): Promise<DiagnosisEntity | null>;
  update(id: DiagnosisId, partial: Partial<IDiagnosisProps>): Promise<DiagnosisEntity>;
  softDelete(id: DiagnosisId): Promise<void>;
  list(offset: number, limit: number): Promise<DiagnosisEntity[]>;
  countAll(): Promise<number>;
}
