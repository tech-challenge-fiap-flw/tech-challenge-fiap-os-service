export type DiagnosisId = number;

export interface IDiagnosisProps {
  id?: DiagnosisId;
  description: string;
  creationDate: Date;
  vehicleId: number;
  mechanicId?: number | null;
  deletedAt?: Date | null;
}

export class DiagnosisEntity {
  private props: IDiagnosisProps;
  private constructor(props: IDiagnosisProps) { this.props = props; }
  static create(input: Omit<IDiagnosisProps, 'id' | 'creationDate' | 'deletedAt'>) {
    return new DiagnosisEntity({ ...input, creationDate: new Date(), deletedAt: null });
  }
  static restore(props: IDiagnosisProps) { return new DiagnosisEntity(props); }
  toJSON(): IDiagnosisProps { return { ...this.props }; }
}
