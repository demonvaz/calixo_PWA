'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { GroupChallengePanel } from '@/components/groups/group-challenge-panel';
import { Spinner } from '@/components/ui/spinner';
import type { GroupChallenge } from '@/types';

export default function GroupChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const [activeChallenge, setActiveChallenge] = useState<GroupChallenge | null>(null);
  const [canStart, setCanStart] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = useCallback(async () => {
    try {
      const [challengeRes, groupRes, profileRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/challenges`),
        fetch(`/api/groups/${groupId}`),
        fetch('/api/profile'),
      ]);

      const profileData = profileRes.ok ? await profileRes.json() : null;
      const myId = profileData?.profile?.userId;
      let activeRaw = null;

      if (challengeRes.ok) {
        const data = await challengeRes.json();
        activeRaw = data.activeChallenge;
        if (activeRaw) {
          setActiveChallenge({
            id: activeRaw.id,
            groupId: activeRaw.group_id,
            organizerId: activeRaw.organizer_id,
            durationMinutes: activeRaw.duration_minutes,
            status: activeRaw.status,
            baseReward: activeRaw.base_reward,
            totalPot: activeRaw.total_pot,
            weekKey: activeRaw.week_key,
            startedAt: activeRaw.started_at,
            endedAt: activeRaw.ended_at,
            participants: (activeRaw.participants || []).map(
              (p: { userId: string; displayName: string; betAmount: number; status: string }) => ({
                ...p,
                isMe: p.userId === myId,
              })
            ),
          });
        } else {
          setActiveChallenge(null);
        }
      }

      if (groupRes.ok) {
        const groupData = await groupRes.json();
        const isOrganizer = activeRaw?.organizer_id === myId;
        setCanStart(isOrganizer || groupData.group?.myRole === 'admin');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChallenge();
    const interval = setInterval(fetchChallenge, 15000);
    return () => clearInterval(interval);
  }, [fetchChallenge]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <GroupChallengePanel
      groupId={groupId}
      activeChallenge={activeChallenge}
      onRefresh={fetchChallenge}
      canStart={canStart}
    />
  );
}
