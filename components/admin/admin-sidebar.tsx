'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  role: AdminRole;
}

const adminMenuItems = [
  { title: 'Dashboard', href: '/admin', icon: '📊', adminOnly: false },
  { title: 'Usuarios', href: '/admin/users', icon: '👥', adminOnly: true },
  { title: 'Retos', href: '/admin/challenges', icon: '🎯', adminOnly: true },
  { title: 'Moderación', href: '/admin/moderation', icon: '⚠️', adminOnly: false },
  { title: 'Banners', href: '/admin/banners', icon: '🖼️', adminOnly: true },
  { title: 'Cupones', href: '/admin/coupons', icon: '🎫', adminOnly: true },
  { title: 'Subscripciones', href: '/admin/subscriptions', icon: '💳', adminOnly: true },
  { title: 'Configuración', href: '/admin/config', icon: '⚙️', adminOnly: true },
  { title: 'Analytics', href: '/admin/analytics', icon: '📈', adminOnly: true },
];

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = role === 'admin';
  const visibleItems = adminMenuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2.5 rounded-xl bg-white border border-neutral/10 shadow-sm"
        aria-label="Abrir menú"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-10"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-56 bg-white border-r border-neutral/10 z-20 transition-transform duration-200',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-neutral/10">
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="block">
            <h2 className="text-lg font-bold text-text-dark font-serif">Calixo Admin</h2>
          </Link>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-neutral hover:bg-neutral/10 hover:text-text-dark'
                )}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral/10">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-neutral hover:bg-neutral/10 hover:text-text-dark transition-colors"
          >
            <span>←</span>
            <span>Volver al Feed</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

