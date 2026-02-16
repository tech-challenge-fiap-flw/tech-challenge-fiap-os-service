export type ServiceOrderHistoryId = string;

export interface IServiceOrderHistoryProps {
  id?: ServiceOrderHistoryId;
  idServiceOrder: number;
  userId: number;
  oldStatus?: string | null;
  newStatus: string;
  changedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceOrderHistoryEntity {
  private constructor(private readonly props: IServiceOrderHistoryProps) {}

  static create(input: Omit<IServiceOrderHistoryProps, 'id' | 'changedAt' | 'createdAt' | 'updatedAt'>) {
    return new ServiceOrderHistoryEntity({ ...input, changedAt: new Date() });
  }

  static restore(props: IServiceOrderHistoryProps) {
    return new ServiceOrderHistoryEntity(props);
  }

  toJSON(): IServiceOrderHistoryProps {
    return { ...this.props };
  }
}
