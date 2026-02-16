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
      {/* Botón hamburguesa móvil */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-xl bg-white border border-neutral/20 shadow-sm"
        aria-label="Abrir menú"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-10"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral/20 z-10 transition-transform duration-200',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      <div className="p-6 border-b border-neutral/20">
        <h2 className="text-xl font-bold text-text-dark font-serif">Calixo Admin</h2>
        <p className="text-sm text-neutral mt-1">
          Administrador
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
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
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral hover:bg-neutral/10 hover:text-text-dark transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Volver al Feed</span>
        </Link>
      </div>
    </aside>
    </>
  );
}

