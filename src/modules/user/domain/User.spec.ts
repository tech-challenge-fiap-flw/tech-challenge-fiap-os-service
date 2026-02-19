import { UserEntity, IUserProps } from './User';

describe('UserEntity', () => {
  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed123',
    type: 'customer',
    cpf: '12345678901',
    cnpj: null,
    phone: '11999999999',
    address: 'Rua Teste',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
  };

  describe('create', () => {
    it('should create a new UserEntity with active=true and a creationDate', () => {
      const entity = UserEntity.create(validInput);
      const json = entity.toJSON();

      expect(json.name).toBe(validInput.name);
      expect(json.email).toBe(validInput.email);
      expect(json.password).toBe(validInput.password);
      expect(json.type).toBe(validInput.type);
      expect(json.cpf).toBe(validInput.cpf);
      expect(json.phone).toBe(validInput.phone);
      expect(json.active).toBe(true);
      expect(json.creationDate).toBeInstanceOf(Date);
      expect(json.id).toBeUndefined();
    });

    it('should create entity with optional fields as null', () => {
      const input = { ...validInput, cnpj: undefined, address: undefined, city: undefined, state: undefined, zipCode: undefined };
      const entity = UserEntity.create(input);
      const json = entity.toJSON();

      expect(json.name).toBe(validInput.name);
      expect(json.active).toBe(true);
    });
  });

  describe('restore', () => {
    it('should restore a UserEntity from raw props', () => {
      const props: IUserProps = {
        id: 42,
        name: 'Jane',
        email: 'jane@test.com',
        password: 'hash',
        type: 'admin',
        active: false,
        creationDate: new Date('2024-01-01'),
        cpf: '99999999999',
        cnpj: '12345678000199',
        phone: '119888',
        address: null,
        city: null,
        state: null,
        zipCode: null,
      };

      const entity = UserEntity.restore(props);
      const json = entity.toJSON();

      expect(json.id).toBe(42);
      expect(json.name).toBe('Jane');
      expect(json.email).toBe('jane@test.com');
      expect(json.active).toBe(false);
      expect(json.cnpj).toBe('12345678000199');
    });
  });

  describe('toJSON', () => {
    it('should return a shallow copy of props', () => {
      const entity = UserEntity.create(validInput);
      const json1 = entity.toJSON();
      const json2 = entity.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2);
    });
  });
});
