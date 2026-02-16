import { z } from 'zod';

export const logHistorySchema = z.object({
  idServiceOrder: z.number().int().positive(),
  userId: z.number().int().positive(),
  oldStatus: z.string().optional().nullable(),
  newStatus: z.string().min(1),
});

export const listHistorySchema = z.object({
  idServiceOrder: z.number().int().positive(),
});

export type LogHistoryInput = z.infer<typeof logHistorySchema>;
