import { z } from 'zod';

export const acceptSchema = z.object({
  accept: z.boolean()
})

export const createSchema = z.object({
  description: z.string().min(1, { message: 'Descrição não pode ser vazia.' }),
  vehicleId: z.number().int(),
  budgetId: z.number().int().optional(),
});
