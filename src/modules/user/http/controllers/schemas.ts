import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  type: z.string(),
  cpf: z.string().min(11).max(14),
  cnpj: z.string().optional().nullable(),
  phone: z.string(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
});

export const updateUserSchema = createUserSchema.partial();
