import { z } from 'zod';

export const createDiagnosisSchema = z.object({
  description: z.string().min(3),
  vehicleId: z.number().int().positive(),
  mechanicId: z.number().int().positive().optional(),
  status: z.string().optional(),
});

export const updateDiagnosisSchema = createDiagnosisSchema.partial();

export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;
export type UpdateDiagnosisInput = z.infer<typeof updateDiagnosisSchema>;
