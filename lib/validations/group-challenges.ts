import { z } from 'zod';

export const createGroupChallengeSchema = z.object({
  durationMinutes: z.number().int().min(30).refine(
    (v) => v % 30 === 0,
    { message: 'La duración debe ser múltiplo de 30 minutos' }
  ),
  scheduledStart: z.string().datetime().optional(),
});

export const betSchema = z.object({
  amount: z.number().int().min(1).max(10000),
});

export const reportFailureSchema = z.object({
  reason: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export const finishChallengeSchema = z.object({
  sessionData: z.record(z.string(), z.unknown()).optional(),
});
