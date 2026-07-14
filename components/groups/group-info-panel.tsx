'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { GroupInviteButton } from '@/components/groups/group-invite-button';
import { MAX_GROUP_MEMBERS } from '@/lib/groups/constants';
import { cn } from '@/lib/utils';
import type { GroupDetail, GroupMember } from '@/types';

interface GroupInfoPanelProps {
  groupId: string;
}

function MemberAvatar({ member, size = 44 }: { member: GroupMember; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200"
      style={{ width: size, height: size }}
    >
      {member.profilePhotoUrl ? (
        <Image
          src={member.profilePhotoUrl}
          alt={member.displayName || 'Usuario'}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-gray-500 font-semibold bg-primary/10 text-primary"
          style={{ fontSize: size * 0.38 }}
        >
          {member.displayName?.[0]?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

export function GroupInfoPanel({ groupId }: GroupInfoPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGroup = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}`);
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    setGroup(data.group);
    setEditName(data.group.name);
    setEditDescription(data.group.description || '');
  }, [groupId]);

  useEffect(() => {
    fetchGroup()
      .catch(() => router.push('/groups'))
      .finally(() => setLoading(false));
  }, [fetchGroup, router]);

  const isAdmin = group?.myRole === 'admin';
  const memberCount = group?.members.length ?? 0;

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGroup((prev) =>
        prev
          ? { ...prev, name: editName.trim(), description: editDescription.trim() }
          : prev
      );
      setEditing(false);
      toast.success('Grupo actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = (member: GroupMember) => {
    const isSelf = member.userId === group?.myUserId;
    confirmDialog.confirm({
      title: isSelf ? 'Salir del grupo' : 'Eliminar miembro',
      message: isSelf
        ? '¿Seguro que quieres salir de este grupo?'
        : `¿Eliminar a ${member.displayName || 'este miembro'} del grupo?`,
      confirmText: isSelf ? 'Salir' : 'Eliminar',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/groups/${groupId}/members/${member.userId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          if (isSelf) {
            toast.success('Has salido del grupo');
            router.push('/groups');
          } else {
            toast.success('Miembro eliminado');
            await fetchGroup();
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Error');
        }
      },
    });
  };

  const deleteGroup = () => {
    confirmDialog.confirm({
      title: 'Eliminar grupo',
      message: `¿Seguro que quieres eliminar "${group?.name}"? Se borrarán todos los mensajes y datos del grupo. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar grupo',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success('Grupo eliminado');
          router.push('/groups');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Error al eliminar');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!group) return null;

  const sortedMembers = [...group.members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return (a.displayName || '').localeCompare(b.displayName || '', 'es');
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Cabecera del grupo */}
      <div className="bg-white px-4 py-8 flex flex-col items-center border-b">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-primary">
            {group.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {editing ? (
          <div className="w-full max-w-sm space-y-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre del grupo"
              maxLength={100}
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Descripción del grupo"
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditing(false);
                  setEditName(group.name);
                  setEditDescription(group.description || '');
                }}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || editName.trim().length < 2}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 text-center">{group.name}</h2>
            {group.description ? (
              <p className="text-sm text-gray-500 text-center mt-2 max-w-sm">{group.description}</p>
            ) : (
              <p className="text-sm text-gray-400 text-center mt-2 italic">Sin descripción</p>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm text-primary mt-3 hover:underline"
              >
                Editar nombre y descripción
              </button>
            )}
          </>
        )}
      </div>

      {/* Participantes */}
      <div className="mt-2 bg-white border-y">
        <div className="px-4 py-3 border-b">
          <p className="text-sm text-gray-500">
            {memberCount} {memberCount === 1 ? 'participante' : 'participantes'}
          </p>
        </div>

        {memberCount < MAX_GROUP_MEMBERS && (
          <div className="border-b">
            <GroupInviteButton
              groupId={groupId}
              label="Añadir participante"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-primary font-medium"
              onInvited={fetchGroup}
              showAddIcon
            />
          </div>
        )}

        <ul>
          {sortedMembers.map((member) => {
            const isMe = member.userId === group.myUserId;
            const canRemove = isAdmin && !isMe;

            return (
              <li
                key={member.userId}
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
              >
                <Link href={`/profile/${member.userId}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <MemberAvatar member={member} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {member.displayName || 'Usuario'}
                      {isMe && <span className="text-gray-400 font-normal"> (tú)</span>}
                    </p>
                    {member.role === 'admin' && (
                      <p className="text-xs text-primary">Administrador</p>
                    )}
                  </div>
                </Link>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => removeMember(member)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-lg flex-shrink-0',
                      isMe
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {isMe ? 'Salir' : 'Eliminar'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Acciones destructivas */}
      <div className="mt-4 bg-white border-y px-4 py-2 space-y-1">
        <button
          type="button"
          onClick={() => {
            const me = group.members.find((m) => m.userId === group.myUserId);
            if (me) removeMember(me);
          }}
          className="w-full text-left py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg px-2 -mx-2"
        >
          Salir del grupo
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={deleteGroup}
            className="w-full text-left py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg px-2 -mx-2"
          >
            Eliminar grupo
          </button>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
