import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { createNotification, distributeGroupChallengePrizes } from '../lib/group-challenges/distribute-prizes';
import { calculateBaseReward, getWeekKey } from '../lib/group-challenges/week-limit';
import { MAX_GROUP_MEMBERS } from '../lib/groups/constants';
import { inviteGroupMember } from '../lib/groups/invite-member';
import { getGroupMessageReadBy, resolveProfilePhotoUrl } from '../lib/messaging/read-receipts';
import { createServiceRoleClient } from '../lib/supabase/server';
import { betSchema, createGroupChallengeSchema, finishChallengeSchema, reportFailureSchema } from '../lib/validations/group-challenges';
import { createGroupSchema, invitationActionSchema, inviteMemberSchema, markGroupReadSchema, sendGroupMessageSchema, updateGroupSchema } from '../lib/validations/groups';

// --- Helpers from app/api/groups/route.ts ---
/**
 * GET /api/groups
 */


/**
 * POST /api/groups
 */

// --- Helpers from app/api/groups/[id]/route.ts ---
interface RouteParams {
  params: Promise<{ id: string }>;
}async function getMembership(groupId: string, userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return data;
}

// --- Helpers from app/api/groups/[id]/messages/route.ts ---
async function verifyMember(groupId: string, userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// --- Helpers from app/api/groups/[id]/challenges/[cid]/route.ts ---
async function getChallenge(groupId: string, challengeId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('group_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('group_id', groupId)
    .single();
  return data;
}

const router = Router();

// Migrated from app/api/groups/route.ts
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const admin = createServiceRoleClient();

    const { data: memberships } = await admin
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return res.json({ groups: [] });
    }

    const groupIds = memberships.map((m) => m.group_id);
    const roleMap = Object.fromEntries(memberships.map((m) => [m.group_id, m.role]));

    const { data: groups } = await admin
      .from('chat_groups')
      .select('id, name, description, avatar_path, created_by, updated_at')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    const results = [];

    for (const group of groups || []) {
      const { count: memberCount } = await admin
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      const { data: lastMessage } = await admin
        .from('group_messages')
        .select('content, created_at, sender_id')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: readState } = await admin
        .from('group_message_reads')
        .select('last_read_message_id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      const lastRead = readState?.last_read_message_id || 0;
      const { count: unreadCount } = await admin
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .gt('id', lastRead);

      results.push({
        id: group.id,
        name: group.name,
        description: group.description,
        avatarPath: group.avatar_path,
        memberCount: memberCount || 0,
        role: roleMap[group.id],
        updatedAt: group.updated_at,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.created_at,
              isOwn: lastMessage.sender_id === user.id,
            }
          : null,
        unreadCount: unreadCount || 0,
      });
    }

    return res.json({ groups: results });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

// Migrated from app/api/groups/route.ts
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    
    const body = req.body;
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();
    const { data: group, error } = await admin
      .from('chat_groups')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !group) throw error;

    const inviteIds = parsed.data.inviteIds || [];
    if (inviteIds.length > 0) {
      if (inviteIds.includes(user.id)) {
        return res.status(400).json({ error: 'No puedes invitarte a ti mismo' });
      }

      if (inviteIds.length > MAX_GROUP_MEMBERS - 1) {
        return res.status(400).json({ error: `Máximo ${MAX_GROUP_MEMBERS - 1} invitados al crear el grupo` });
      }

      const { data: validUsers } = await admin
        .from('users')
        .select('id')
        .in('id', inviteIds);

      if ((validUsers || []).length !== inviteIds.length) {
        return res.status(400).json({ error: 'Uno o más usuarios no son válidos' });
      }

      for (const inviteeId of inviteIds) {
        const result = await inviteGroupMember(admin, group.id, user.id, inviteeId);
        if ('error' in result && result.status !== 400) {
          throw new Error(result.error);
        }
      }
    }

    return res.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.created_by,
      },
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Migrated from app/api/groups/[id]/route.ts
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const membership = await getMembership(groupId, user.id);
    if (!membership) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const admin = createServiceRoleClient();
    const { data: group } = await admin
      .from('chat_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    const { data: members } = await admin
      .from('group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId);

    const memberIds = (members || []).map((m) => m.user_id);
    const { data: users } = await admin
      .from('users')
      .select('id, display_name, profile_photo_path, is_premium')
      .in('id', memberIds);

    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

    return res.json({
      group: {
        id: group?.id,
        name: group?.name,
        description: group?.description,
        avatarPath: group?.avatar_path,
        createdBy: group?.created_by,
        updatedAt: group?.updated_at,
        myRole: membership.role,
        myUserId: user.id,
        members: (members || []).map((m) => ({
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          displayName: userMap[m.user_id]?.display_name,
          profilePhotoPath: userMap[m.user_id]?.profile_photo_path,
          profilePhotoUrl: resolveProfilePhotoUrl(userMap[m.user_id]?.profile_photo_path ?? null),
          isPremium: userMap[m.user_id]?.is_premium,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return res.status(500).json({ error: 'Error al obtener grupo' });
  }
});

// Migrated from app/api/groups/[id]/route.ts
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const membership = await getMembership(groupId, user.id);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const body = req.body;
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();
    const updates: Record<string, string> = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;

    const { data: group, error } = await admin
      .from('chat_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;

    return res.json({ group });
  } catch (error) {
    console.error('Error updating group:', error);
    return res.status(500).json({ error: 'Error al actualizar grupo' });
  }
});

// Migrated from app/api/groups/[id]/route.ts
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const membership = await getMembership(groupId, user.id);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar el grupo' });
    }

    const admin = createServiceRoleClient();
    const { error } = await admin
      .from('chat_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return res.status(500).json({ error: 'Error al eliminar grupo' });
  }
});

// Migrated from app/api/groups/[id]/stats/route.ts
router.get('/:id/stats', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const admin = createServiceRoleClient();
    const { data: membership } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const { data: challenges } = await admin
      .from('group_challenges')
      .select('id, duration_minutes, status, total_pot, created_at, organizer_id')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    const completed = (challenges || []).filter((c) => c.status === 'distributed');
    const active = (challenges || []).find((c) =>
      ['betting', 'in_progress', 'finished'].includes(c.status)
    );

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const memberStats: Record<string, { wins: number; losses: number; totalEarned: number }> = {};

    for (const m of members || []) {
      memberStats[m.user_id] = { wins: 0, losses: 0, totalEarned: 0 };
    }

    const challengeIds = (challenges || []).map((c) => c.id);
    if (challengeIds.length > 0) {
      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id, status, group_challenge_id')
        .in('group_challenge_id', challengeIds);

      for (const p of participants || []) {
        if (!memberStats[p.user_id]) continue;
        if (p.status === 'success') memberStats[p.user_id].wins++;
        if (p.status === 'failed') memberStats[p.user_id].losses++;
      }

      const { data: earnings } = await admin
        .from('transactions')
        .select('user_id, amount')
        .eq('group_id', groupId)
        .eq('type', 'earn');

      for (const t of earnings || []) {
        if (memberStats[t.user_id]) {
          memberStats[t.user_id].totalEarned += t.amount;
        }
      }
    }

    const memberIds = Object.keys(memberStats);
    const { data: users } = await admin
      .from('users')
      .select('id, display_name')
      .in('id', memberIds);

    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u.display_name]));

    const ranking = memberIds
      .map((id) => ({
        userId: id,
        displayName: userMap[id] || 'Usuario',
        ...memberStats[id],
        successRate:
          memberStats[id].wins + memberStats[id].losses > 0
            ? Math.round(
                (memberStats[id].wins / (memberStats[id].wins + memberStats[id].losses)) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.wins - a.wins);

    return res.json({
      stats: {
        totalChallenges: (challenges || []).length,
        completedChallenges: completed.length,
        totalCoinsDistributed: completed.reduce((s, c) => s + (c.total_pot || 0), 0),
        activeChallenge: active || null,
        ranking,
        recentChallenges: (challenges || []).slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Migrated from app/api/groups/[id]/read/route.ts
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const body = req.body;
    const parsed = markGroupReadSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();
    await admin.from('group_message_reads').upsert({
      group_id: groupId,
      user_id: user.id,
      last_read_message_id: parsed.data.lastReadMessageId,
      last_read_at: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking group read:', error);
    return res.status(500).json({ error: 'Error al marcar como leído' });
  }
});

// Migrated from app/api/groups/[id]/members/[userId]/route.ts
router.delete('/:id/members/:userId', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId, userId: targetUserId } = req.params;
    
    const admin = createServiceRoleClient();
    const { data: myMembership } = await admin
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!myMembership) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const isSelf = targetUserId === user.id;
    const isAdmin = myMembership.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await admin
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetUserId);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ error: 'Error al eliminar miembro' });
  }
});

// Migrated from app/api/groups/[id]/messages/route.ts
router.get('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    if (!(await verifyMember(groupId, user.id))) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const searchParams = new URLSearchParams(req.query as any);
    const before = searchParams.get('before');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const admin = createServiceRoleClient();
    let query = admin
      .from('group_messages')
      .select('id, sender_id, content, image_url, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('id', parseInt(before, 10));
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    const senderIds = [...new Set((messages || []).map((m) => m.sender_id))];
    const { data: users } = await admin
      .from('users')
      .select('id, display_name')
      .in('id', senderIds);

    const userMap = Object.fromEntries((users || []).map((u) => [u.id, u.display_name]));

    const reversed = (messages || []).reverse();
    const readByMap = await getGroupMessageReadBy(
      groupId,
      reversed.map((m) => ({ id: m.id, sender_id: m.sender_id }))
    );

    const formatted = reversed.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: userMap[m.sender_id] || 'Usuario',
      content: m.content,
      imageUrl: m.image_url,
      createdAt: m.created_at,
      isOwn: m.sender_id === user.id,
      readBy: readByMap[m.id] || [],
    }));

    return res.json({ messages: formatted });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Migrated from app/api/groups/[id]/messages/route.ts
router.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    if (!(await verifyMember(groupId, user.id))) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const body = req.body;
    const parsed = sendGroupMessageSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();
    const { data: message, error } = await admin
      .from('group_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content: parsed.data.content?.trim() || '',
        image_url: parsed.data.imageUrl || null,
      })
      .select()
      .single();

    if (error || !message) throw error;

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', user.id);

    const { data: sender } = await admin.from('users').select('display_name').eq('id', user.id).single();
    const { data: group } = await admin.from('chat_groups').select('name').eq('id', groupId).single();

    for (const m of members || []) {
      await admin.from('notifications').insert({
        user_id: m.user_id,
        type: 'social',
        title: group?.name || 'Grupo',
        message: `${sender?.display_name}: ${(parsed.data.content || 'Imagen').slice(0, 60)}`,
        payload: { type: 'group_message', groupId, messageId: message.id },
        seen: false,
      });
    }

    return res.json({
      message: {
        id: message.id,
        senderId: message.sender_id,
        content: message.content,
        imageUrl: message.image_url,
        createdAt: message.created_at,
        isOwn: true,
      },
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    return res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// Migrated from app/api/groups/[id]/messages/[messageId]/route.ts
router.delete('/:id/messages/:messageId', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId, messageId } = req.params;
    
    if (!(await verifyMember(groupId, user.id))) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const admin = createServiceRoleClient();
    const { data: message } = await admin
      .from('group_messages')
      .select('id, sender_id, group_id')
      .eq('id', parseInt(messageId, 10))
      .eq('group_id', groupId)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    if (message.sender_id !== user.id) {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios mensajes' });
    }

    await admin.from('group_messages').delete().eq('id', message.id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group message:', error);
    return res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
});

// Migrated from app/api/groups/[id]/invitations/[invId]/route.ts
router.patch('/:id/invitations/:invId', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId, invId } = req.params;
    
    const body = req.body;
    const parsed = invitationActionSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();
    const { data: invitation } = await admin
      .from('group_invitations')
      .select('*')
      .eq('id', invId)
      .eq('group_id', groupId)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .single();

    if (!invitation) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    if (parsed.data.action === 'accept') {
      const { count: memberCount } = await admin
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if ((memberCount || 0) >= MAX_GROUP_MEMBERS) {
        return res.status(400).json({ error: `El grupo ha alcanzado el máximo de ${MAX_GROUP_MEMBERS} miembros` });
      }

      await admin.from('group_invitations').update({ status: 'accepted' }).eq('id', invId);
      await admin.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      });
    } else {
      await admin.from('group_invitations').update({ status: 'rejected' }).eq('id', invId);
    }

    return res.json({ success: true, action: parsed.data.action });
  } catch (error) {
    console.error('Error processing invitation:', error);
    return res.status(500).json({ error: 'Error al procesar invitación' });
  }
});

// Migrated from app/api/groups/[id]/challenges/route.ts
router.get('/:id/challenges', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const admin = createServiceRoleClient();
    const { data: membership } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const { data: challenges } = await admin
      .from('group_challenges')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    const active = (challenges || []).find((c) =>
      ['betting', 'in_progress', 'finished'].includes(c.status)
    );

    let activeWithParticipants = null;
    if (active) {
      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id, bet_amount, status, failed_at')
        .eq('group_challenge_id', active.id);

      const userIds = (participants || []).map((p) => p.user_id);
      const { data: users } = await admin
        .from('users')
        .select('id, display_name')
        .in('id', userIds);

      const userMap = Object.fromEntries((users || []).map((u) => [u.id, u.display_name]));

      activeWithParticipants = {
        ...active,
        participants: (participants || []).map((p) => ({
          userId: p.user_id,
          displayName: userMap[p.user_id],
          betAmount: p.bet_amount,
          status: p.status,
          failedAt: p.failed_at,
        })),
      };
    }

    return res.json({
      challenges: challenges || [],
      activeChallenge: activeWithParticipants,
    });
  } catch (error) {
    console.error('Error fetching group challenges:', error);
    return res.status(500).json({ error: 'Error al obtener retos' });
  }
});

// Migrated from app/api/groups/[id]/challenges/route.ts
router.post('/:id/challenges', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const body = req.body;
    const parsed = createGroupChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const admin = createServiceRoleClient();

    const { data: membership } = await admin
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const { data: organizer } = await admin
      .from('users')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    const weekKey = getWeekKey();
    const isPremium = organizer?.is_premium || false;

    const { count: weekCount } = await admin
      .from('group_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('week_key', weekKey)
      .eq('is_premium_override', false)
      .not('status', 'eq', 'canceled');

    if (!isPremium && (weekCount || 0) >= 1) {
      return res.status(403).json({ error: 'Ya se ha creado un reto grupal esta semana. Un miembro premium puede crear más.' });
    }

    const isPremiumOverride = isPremium && (weekCount || 0) >= 1;

    const { data: activeChallenge } = await admin
      .from('group_challenges')
      .select('id')
      .eq('group_id', groupId)
      .in('status', ['betting', 'in_progress', 'finished'])
      .single();

    if (activeChallenge) {
      return res.status(400).json({ error: 'Ya hay un reto activo en este grupo' });
    }

    const baseReward = calculateBaseReward(parsed.data.durationMinutes);

    const { data: challenge, error } = await admin
      .from('group_challenges')
      .insert({
        group_id: groupId,
        organizer_id: user.id,
        duration_minutes: parsed.data.durationMinutes,
        status: 'betting',
        week_key: weekKey,
        base_reward: baseReward,
        total_pot: baseReward,
        scheduled_start: parsed.data.scheduledStart || null,
        is_premium_override: isPremiumOverride,
      })
      .select()
      .single();

    if (error || !challenge) throw error;

    const { data: members } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    for (const m of members || []) {
      await admin.from('group_challenge_participants').upsert({
        group_challenge_id: challenge.id,
        user_id: m.user_id,
        bet_amount: 0,
        status: 'invited',
      });

      if (m.user_id !== user.id) {
        await createNotification(
          m.user_id,
          'challenge',
          'Nuevo reto grupal',
          `Reto de ${parsed.data.durationMinutes} min en tu grupo`,
          { type: 'group_challenge_created', groupId, challengeId: challenge.id }
        );
      }
    }

    return res.json({ challenge });
  } catch (error) {
    console.error('Error creating group challenge:', error);
    return res.status(500).json({ error: 'Error al crear reto grupal' });
  }
});

// Migrated from app/api/groups/[id]/challenges/[cid]/route.ts
router.post('/:id/challenges/:cid', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId, cid: challengeId } = req.params;
    
    const challenge = await getChallenge(groupId, challengeId);
    if (!challenge || challenge.status !== 'betting') {
      return res.status(400).json({ error: 'No se pueden hacer apuestas ahora' });
    }

    const body = req.body;
    const action = body.action as string;

    const admin = createServiceRoleClient();

    if (action === 'bet') {
      const parsed = betSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { data: userData } = await admin.from('users').select('coins').eq('id', user.id).single();
      if (!userData || userData.coins < parsed.data.amount) {
        return res.status(400).json({ error: 'Monedas insuficientes' });
      }

      const { data: existing } = await admin
        .from('group_challenge_participants')
        .select('bet_amount')
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      const previousBet = existing?.bet_amount || 0;

      await admin.from('users').update({ coins: userData.coins - parsed.data.amount }).eq('id', user.id);
      await admin.from('transactions').insert({
        user_id: user.id,
        amount: parsed.data.amount,
        type: 'spend',
        description: 'Apuesta reto grupal',
        group_challenge_id: challengeId,
        group_id: groupId,
      });

      await admin.from('group_challenge_participants').upsert({
        group_challenge_id: challengeId,
        user_id: user.id,
        bet_amount: previousBet + parsed.data.amount,
        status: 'bet_placed',
      });

      const newPot = (challenge.total_pot || 0) + parsed.data.amount;
      await admin.from('group_challenges').update({ total_pot: newPot }).eq('id', challengeId);

      return res.json({ success: true, totalPot: newPot });
    }

    if (action === 'start') {
      if (challenge.organizer_id !== user.id) {
        return res.status(403).json({ error: 'Solo el organizador puede iniciar' });
      }

      await admin
        .from('group_challenges')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', challengeId);

      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id')
        .eq('group_challenge_id', challengeId);

      for (const p of participants || []) {
        await admin
          .from('group_challenge_participants')
          .update({ status: 'active' })
          .eq('group_challenge_id', challengeId)
          .eq('user_id', p.user_id)
          .in('status', ['invited', 'bet_placed']);

        await createNotification(
          p.user_id,
          'challenge',
          'Reto grupal iniciado',
          '¡El reto ha comenzado! No cojas el móvil.',
          { type: 'group_challenge_starting', groupId, challengeId }
        );
      }

      return res.json({ success: true, status: 'in_progress' });
    }

    if (action === 'report-failure') {
      if (challenge.status !== 'in_progress') {
        return res.status(400).json({ error: 'El reto no está en curso' });
      }

      const parsed = reportFailureSchema.safeParse(body);
      const reason = parsed.success ? parsed.data.reason : 'visibility';

      const { data: participant } = await admin
        .from('group_challenge_participants')
        .select('status, session_data')
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (!participant || participant.status === 'failed') {
        return res.json({ success: true, alreadyFailed: true });
      }

      const sessionData = {
        ...(participant.session_data as Record<string, unknown> || {}),
        failures: [
          ...((participant.session_data as Record<string, unknown>)?.failures as unknown[] || []),
          { reason, at: new Date().toISOString() },
        ],
      };

      await admin
        .from('group_challenge_participants')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          session_data: sessionData,
        })
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id);

      return res.json({ success: true, status: 'failed' });
    }

    if (action === 'finish') {
      if (challenge.status !== 'in_progress') {
        return res.status(400).json({ error: 'El reto no está en curso' });
      }

      const parsed = finishChallengeSchema.safeParse(body);
      const sessionData = parsed.success ? parsed.data.sessionData : {};

      const { data: participant } = await admin
        .from('group_challenge_participants')
        .select('status')
        .eq('group_challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (participant && participant.status === 'active') {
        await admin
          .from('group_challenge_participants')
          .update({
            status: 'success',
            session_data: sessionData,
          })
          .eq('group_challenge_id', challengeId)
          .eq('user_id', user.id);
      }

      const { data: stillActive } = await admin
        .from('group_challenge_participants')
        .select('user_id')
        .eq('group_challenge_id', challengeId)
        .eq('status', 'active');

      if (!stillActive || stillActive.length === 0) {
        await admin
          .from('group_challenges')
          .update({ status: 'finished', ended_at: new Date().toISOString() })
          .eq('id', challengeId);

        const result = await distributeGroupChallengePrizes(
          challengeId,
          groupId,
          challenge.base_reward
        );

        for (const winnerId of result.winners) {
          await createNotification(
            winnerId,
            'reward',
            '¡Ganaste el reto grupal!',
            `Has ganado ${result.prizePerWinner} monedas`,
            { type: 'group_challenge_won', groupId, challengeId, amount: result.prizePerWinner }
          );
        }

        const { data: losers } = await admin
          .from('group_challenge_participants')
          .select('user_id')
          .eq('group_challenge_id', challengeId)
          .eq('status', 'failed');

        for (const l of losers || []) {
          await createNotification(
            l.user_id,
            'challenge',
            'Reto grupal perdido',
            'Has cogido el móvil durante el reto',
            { type: 'group_challenge_lost', groupId, challengeId }
          );
        }

        return res.json({ success: true, status: 'distributed', ...result });
      }

      return res.json({ success: true, status: 'waiting_others' });
    }

    if (action === 'cancel') {
      if (challenge.organizer_id !== user.id) {
        return res.status(403).json({ error: 'Solo el organizador puede cancelar' });
      }

      if (!['betting', 'scheduled'].includes(challenge.status)) {
        return res.status(400).json({ error: 'No se puede cancelar ahora' });
      }

      const { data: participants } = await admin
        .from('group_challenge_participants')
        .select('user_id, bet_amount')
        .eq('group_challenge_id', challengeId);

      for (const p of participants || []) {
        if (p.bet_amount > 0) {
          const { data: userData } = await admin.from('users').select('coins').eq('id', p.user_id).single();
          if (userData) {
            await admin.from('users').update({ coins: userData.coins + p.bet_amount }).eq('id', p.user_id);
            await admin.from('transactions').insert({
              user_id: p.user_id,
              amount: p.bet_amount,
              type: 'earn',
              description: 'Devolución apuesta (reto cancelado)',
              group_challenge_id: challengeId,
              group_id: groupId,
            });
          }
        }
      }

      await admin.from('group_challenges').update({ status: 'canceled' }).eq('id', challengeId);
      return res.json({ success: true, status: 'canceled' });
    }

    return res.status(400).json({ error: 'Acción no válida' });
  } catch (error) {
    console.error('Error in group challenge action:', error);
    return res.status(500).json({ error: 'Error en reto grupal' });
  }
});

// Migrated from app/api/groups/[id]/invite/route.ts
router.post('/:id/invite', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { id: groupId } = req.params;
    
    const admin = createServiceRoleClient();
    const { data: membership } = await admin
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const body = req.body;
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { inviteeId } = parsed.data;

    const result = await inviteGroupMember(admin, groupId, user.id, inviteeId);
    if ('error' in result) {
      return res.status(200).json({ error: result.error });
    }

    return res.json({ invitation: result.invitation });
  } catch (error) {
    console.error('Error inviting member:', error);
    return res.status(500).json({ error: 'Error al invitar' });
  }
});

export default router;