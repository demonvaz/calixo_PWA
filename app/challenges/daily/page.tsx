'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirige a /challenges para compatibilidad con enlaces antiguos */
export default function DailyRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/challenges');
  }, [router]);
  return null;
}
