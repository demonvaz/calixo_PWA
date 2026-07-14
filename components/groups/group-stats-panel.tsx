'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GroupStats } from '@/types';

interface GroupStatsPanelProps {
  stats: GroupStats;
}

export function GroupStatsPanel({ stats }: GroupStatsPanelProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalChallenges}</p>
            <p className="text-xs text-gray-500">Retos totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.completedChallenges}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalCoinsDistributed}</p>
            <p className="text-xs text-gray-500">Monedas repartidas en el grupo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de victorias</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.ranking.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin datos aún</p>
          ) : (
            <ul className="space-y-2">
              {stats.ranking.map((member, i) => (
                <li key={member.userId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-gray-400 w-5">{i + 1}.</span>
                    {member.displayName}
                  </span>
                  <span className="text-gray-500">
                    {member.wins}W · {member.successRate}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
