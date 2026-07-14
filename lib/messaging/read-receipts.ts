import { createServiceRoleClient } from '@/lib/supabase/server';

export function resolveProfilePhotoUrl(profilePhotoPath: string | null): string | null {
  if (!profilePhotoPath) return null;
  const pathParts = profilePhotoPath.split('/');
  if (pathParts.length <= 1) return null;

  const bucket = pathParts[0];
  const filePath = pathParts.slice(1).join('/');
  const supabase = createServiceRoleClient();
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

export interface ReadReceiptUser {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  readAt?: string | null;
}

export async function getDmMessageReadBy(
  messageIds: number[],
  senderId: string
): Promise<Record<number, ReadReceiptUser[]>> {
  if (messageIds.length === 0) return {};

  const admin = createServiceRoleClient();
  const { data: receipts } = await admin
    .from('message_read_receipts')
    .select('message_id, user_id, read_at')
    .in('message_id', messageIds)
    .neq('user_id', senderId);

  if (!receipts || receipts.length === 0) return {};

  const userIds = [...new Set(receipts.map((r) => r.user_id))];
  const { data: users } = await admin
    .from('users')
    .select('id, display_name, profile_photo_path')
    .in('id', userIds);

  const userMap = Object.fromEntries(
    (users || []).map((u) => [
      u.id,
      {
        displayName: u.display_name || 'Usuario',
        profilePhotoUrl: resolveProfilePhotoUrl(u.profile_photo_path),
      },
    ])
  );

  const result: Record<number, ReadReceiptUser[]> = {};
  for (const r of receipts) {
    if (!result[r.message_id]) result[r.message_id] = [];
    const user = userMap[r.user_id];
    if (user) {
      result[r.message_id].push({
        userId: r.user_id,
        displayName: user.displayName,
        profilePhotoUrl: user.profilePhotoUrl,
        readAt: r.read_at,
      });
    }
  }
  return result;
}

export async function getGroupMessageReadBy(
  groupId: string,
  messages: { id: number; sender_id: string }[]
): Promise<Record<number, ReadReceiptUser[]>> {
  if (messages.length === 0) return {};

  const admin = createServiceRoleClient();
  const { data: reads } = await admin
    .from('group_message_reads')
    .select('user_id, last_read_message_id, last_read_at')
    .eq('group_id', groupId);

  if (!reads || reads.length === 0) return {};

  const userIds = reads.map((r) => r.user_id);
  const { data: users } = await admin
    .from('users')
    .select('id, display_name, profile_photo_path')
    .in('id', userIds);

  const userMap = Object.fromEntries(
    (users || []).map((u) => [
      u.id,
      {
        displayName: u.display_name || 'Usuario',
        profilePhotoUrl: resolveProfilePhotoUrl(u.profile_photo_path),
      },
    ])
  );

  const result: Record<number, ReadReceiptUser[]> = {};

  for (const msg of messages) {
    const readers: ReadReceiptUser[] = [];
    for (const read of reads) {
      if (read.user_id === msg.sender_id) continue;
      if (!read.last_read_message_id || read.last_read_message_id < msg.id) continue;
      const user = userMap[read.user_id];
      if (user) {
        readers.push({
          userId: read.user_id,
          displayName: user.displayName,
          profilePhotoUrl: user.profilePhotoUrl,
          readAt: read.last_read_at,
        });
      }
    }
    if (readers.length > 0) result[msg.id] = readers;
  }

  return result;
}
