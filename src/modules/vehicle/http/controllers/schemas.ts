import { z } from 'zod';

export const createVehicleSchema = z.object({
  idPlate: z.string().min(3),
  type: z.string().min(1),
  model: z.string().min(1),
  brand: z.string().min(1),
  manufactureYear: z.number().int().gte(1900).lte(new Date().getFullYear() + 1),
  modelYear: z.number().int().gte(1900).lte(new Date().getFullYear() + 1),
  color: z.string().min(1),
  ownerId: z.number().int().positive(),
});

export const updateVehicleSchema = createVehicleSchema.partial();
