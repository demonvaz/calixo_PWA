'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  role: AdminRole;
}

const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: '📊',
    adminOnly: false,
  },
  {
    title: 'Retos',
    href: '/admin/challenges',
    icon: '',
    adminOnly: true,
  },
  {
    title: 'Usuarios',
    href: '/admin/users',
    icon: '',
    adminOnly: true,
  },
  {
    title: 'Moderación',
    href: '/admin/moderation',
    icon: '',
    adminOnly: false,
  },
  {
    title: 'Configuración',
    href: '/admin/config',
    icon: '',
    adminOnly: true,
  },
  {
    title: 'Cupones',
    href: '/admin/coupons',
    icon: '🎫',
    adminOnly: true,
  },
  {
    title: 'Subscripciones',
    href: '/admin/subscriptions',
    icon: '💳',
    adminOnly: true,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: '📈',
    adminOnly: true,
  },
];

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === 'admin';

  const visibleItems = adminMenuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral/20 z-10">
      <div className="p-6 border-b border-neutral/20">
        <h2 className="text-xl font-bold text-text-dark font-serif">Calixo Admin</h2>
        <p className="text-sm text-neutral mt-1">
          {role === 'admin' ? 'Administrador' : 'Moderador'}
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-neutral hover:bg-neutral/10 hover:text-text-dark'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral/20">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral hover:bg-neutral/10 hover:text-text-dark transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Volver al Feed</span>
        </Link>
      </div>
    </aside>
  );
}

