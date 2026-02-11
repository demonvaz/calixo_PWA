'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * El Modo Focus ahora está integrado en la página de Retos (/challenges).
 * Redirigimos para mantener compatibilidad con enlaces antiguos.
 */
export default function FocusModeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/challenges');
  }, [router]);

  return null;
}
