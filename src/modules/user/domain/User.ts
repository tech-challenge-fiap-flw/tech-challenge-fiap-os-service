export type UserId = number;

export interface IUserProps {
  id?: UserId;
  name: string;
  email: string;
  password: string;
  type: string;
  active: boolean;
  creationDate: Date;
  cpf: string;
  cnpj?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export class UserEntity {
  private props: IUserProps;

  private constructor(props: IUserProps) {
    this.props = props;
  }

  static create(props: Omit<IUserProps, 'id' | 'creationDate' | 'active'>): UserEntity {
    return new UserEntity({
      ...props,
      id: undefined,
      active: true,
      creationDate: new Date(),
    });
  }

  static restore(props: IUserProps): UserEntity {
    return new UserEntity(props);
  }

  toJSON(): IUserProps {
    return { ...this.props };
  }
}
