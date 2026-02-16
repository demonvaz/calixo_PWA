'use client';

import { AdminRole } from '@/lib/permissions';

interface ModeToggleProps {
  currentRole: AdminRole;
}

export function ModeToggle({ currentRole }: ModeToggleProps) {
  return (
    <div className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium">
      {currentRole === 'admin' ? 'Administrador' : 'Moderador'}
    </div>
  );
}

