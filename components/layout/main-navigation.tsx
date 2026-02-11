'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from '@/app/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { NotificationBadge } from '@/components/notifications/notification-badge';
import { ChallengeBadge } from '@/components/challenges/challenge-badge';

const navigationItems = [
  { href: '/feed', label: 'Feed' },
  { href: '/search', label: 'Búsqueda' },
  { href: '/challenges', label: 'Retos' },
  { href: '/store', label: 'Tienda' },
  { href: '/profile', label: 'Perfil' },
  { href: '/notifications', label: 'Notificaciones' },
];

// Items para móvil (sin notificaciones para mantener el menú compacto)
const mobileNavigationItems = [
  { 
    href: '/feed', 
    label: 'Feed',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 3h18v18H3z"/>
        <path d="M7 7h10M7 12h10M7 17h7"/>
      </svg>
    )
  },
  { 
    href: '/search', 
    label: 'Búsqueda',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    )
  },
  { 
    href: '/challenges', 
    label: 'Retos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    )
  },
  { 
    href: '/store', 
    label: 'Tienda',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <path d="M3 6h18"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )
  },
  { 
    href: '/profile', 
    label: 'Perfil',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
  { 
    href: '/notifications', 
    label: 'Notificaciones',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    )
  },
];

export function MainNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  // Estado para evitar errores de hidratación
  const [mounted, setMounted] = useState(false);
  // Optimistically assume authenticated if we're on a protected route (not auth/admin pages)
  // This helps show the header immediately after login redirect
  const isProtectedRoute = pathname && !pathname.startsWith('/auth') && !pathname.startsWith('/admin');
  // Estado inicial siempre null para evitar diferencias entre servidor y cliente
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Marcar como montado después de la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const supabase = createClient();
    
    // Set up the auth state change listener FIRST to catch immediate changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setIsLoading(false);
      
      // Force router refresh on sign in to ensure UI updates
      if (event === 'SIGNED_IN' && session) {
        setTimeout(() => {
          router.refresh();
        }, 50);
      }
    });

    // Check current auth state
    const checkAuth = async () => {
      try {
        // Use getSession() first as it's faster
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          // Fallback to getUser() if no session found
          const { data: { user } } = await supabase.auth.getUser();
          const authenticated = !!user;
          setIsAuthenticated(authenticated);
          setIsLoading(false);
          // If we're on a protected route but not authenticated, redirect to login
          if (!authenticated && isProtectedRoute) {
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        if (isProtectedRoute) {
          router.push('/auth/login');
        }
      }
    };

    // Check auth state
    // If we're optimistically authenticated on a protected route, 
    // delay the check slightly to allow cookies to sync
    if (isProtectedRoute) {
      // Optimistically set authenticated for protected routes
      setIsAuthenticated(true);
      setIsLoading(false);
      // Delay check to allow cookies to sync after redirect
      setTimeout(() => {
        checkAuth().catch(() => {
          // Silent fail - we'll rely on the auth state change listener
        });
      }, 200);
    } else {
      checkAuth();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isProtectedRoute, mounted]);

  // When pathname changes to a protected route, optimistically show header
  useEffect(() => {
    if (!mounted) return;
    
    if (pathname && !pathname.startsWith('/auth') && !pathname.startsWith('/admin')) {
      // Immediately show header for protected routes
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (pathname && (pathname.startsWith('/auth') || pathname.startsWith('/admin'))) {
      // Hide header for auth/admin pages
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [pathname, mounted]);

  // No mostrar navegación en páginas de auth o admin
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/admin')) {
    return null;
  }

  // No mostrar navegación mientras se carga o si no está autenticado
  // También no mostrar hasta que el componente esté montado para evitar errores de hidratación
  if (!mounted || isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral/10 shadow-sm" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/feed" 
              className="flex items-center gap-3 group"
            >
              <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Image
                  src="/icons/icon.svg"
                  alt="CALIXO"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-2xl font-bold text-text-dark font-serif tracking-tight">
                CALIXO
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/feed' && pathname?.startsWith(item.href));
                const isNotifications = item.href === '/notifications';
                const isChallenges = item.href === '/challenges';
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
                      'hover:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      'active:bg-transparent active:text-primary',
                      isActive
                        ? 'text-primary'
                        : 'text-neutral'
                    )}
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {item.label}
                    {isNotifications && (
                      <span className="absolute top-0 right-0">
                        <NotificationBadge />
                      </span>
                    )}
                    {isChallenges && (
                      <span className="absolute top-0 right-0">
                        <ChallengeBadge />
                      </span>
                    )}
                    {isActive && (
                      <span 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                        style={{
                          animation: 'slideIn 0.3s ease-out',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
              
              {/* Logout Button */}
              <form action={signOut} className="ml-2">
                <button
                  type="submit"
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full',
                    'bg-primary text-white hover:bg-primary-dark',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'shadow-sm hover:shadow-md'
                  )}
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Cerrar sesión
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral/10 shadow-lg" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className="flex items-center justify-around h-16 px-1">
          {mobileNavigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/feed' && pathname?.startsWith(item.href));
            const isNotifications = item.href === '/notifications';
            const isChallenges = item.href === '/challenges';
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-center flex-1 h-full min-w-0',
                  'transition-all duration-200 relative',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'active:bg-transparent'
                )}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  touchAction: 'manipulation'
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div 
                  className={cn(
                    'transition-all duration-200 relative',
                    isActive ? 'text-primary scale-110' : 'text-neutral'
                  )}
                >
                  {item.icon}
                  {isNotifications && (
                    <span className="absolute top-0 right-0">
                      <NotificationBadge />
                    </span>
                  )}
                  {isChallenges && (
                    <span className="absolute top-0 right-0">
                      <ChallengeBadge />
                    </span>
                  )}
                </div>
                {isActive && (
                  <span 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full"
                    style={{
                      animation: 'slideIn 0.3s ease-out',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer para el header en desktop */}
      <div className="hidden md:block h-16" />
    </>
  );
}
