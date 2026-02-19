import { DiagnosisEntity, IDiagnosisProps } from './Diagnosis';

describe('DiagnosisEntity', () => {
  describe('create', () => {
    it('should create a DiagnosisEntity with creationDate and deletedAt null', () => {
      const entity = DiagnosisEntity.create({
        description: 'Motor falhando',
        vehicleId: 1,
        mechanicId: 2,
      });
      const json = entity.toJSON();

      expect(json.description).toBe('Motor falhando');
      expect(json.vehicleId).toBe(1);
      expect(json.mechanicId).toBe(2);
      expect(json.creationDate).toBeInstanceOf(Date);
      expect(json.deletedAt).toBeNull();
      expect(json.id).toBeUndefined();
    });

    it('should create without mechanicId', () => {
      const entity = DiagnosisEntity.create({
        description: 'Barulho estranho',
        vehicleId: 3,
      });
      const json = entity.toJSON();

      expect(json.mechanicId).toBeUndefined();
      expect(json.vehicleId).toBe(3);
    });
  });

  describe('restore', () => {
    it('should restore a DiagnosisEntity from raw props', () => {
      const props: IDiagnosisProps = {
        id: 5,
        description: 'Freio desgastado',
        creationDate: new Date('2024-03-15'),
        vehicleId: 10,
        mechanicId: 3,
        deletedAt: null,
      };

      const entity = DiagnosisEntity.restore(props);
      const json = entity.toJSON();

      expect(json.id).toBe(5);
      expect(json.description).toBe('Freio desgastado');
      expect(json.creationDate).toEqual(new Date('2024-03-15'));
    });
  });

  describe('toJSON', () => {
    it('should return a shallow copy', () => {
      const entity = DiagnosisEntity.create({ description: 'Test', vehicleId: 1 });
      const json1 = entity.toJSON();
      const json2 = entity.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2);
    });
  });
});
