import { z } from 'zod';

export const createConversationSchema = z.object({
  recipientId: z.string().uuid('ID de destinatario inválido'),
});

export const sendMessageSchema = z.object({
  content: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
}).refine(
  (data) => (data.content && data.content.trim().length > 0) || data.imageUrl,
  { message: 'El mensaje debe tener contenido o imagen' }
);

export const markReadSchema = z.object({
  lastReadMessageId: z.number().int().positive(),
});
