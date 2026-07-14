import { z } from 'zod';
import { MAX_GROUP_MEMBERS } from '@/lib/groups/constants';

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  inviteIds: z
    .array(z.string().uuid())
    .max(MAX_GROUP_MEMBERS - 1, `Máximo ${MAX_GROUP_MEMBERS - 1} invitados`)
    .optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  inviteeId: z.string().uuid(),
});

export const invitationActionSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export const sendGroupMessageSchema = z.object({
  content: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
}).refine(
  (data) => (data.content && data.content.trim().length > 0) || data.imageUrl,
  { message: 'El mensaje debe tener contenido o imagen' }
);

export const markGroupReadSchema = z.object({
  lastReadMessageId: z.number().int().positive(),
});
