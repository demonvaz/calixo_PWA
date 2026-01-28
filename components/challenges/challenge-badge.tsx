'use client';

import { useEffect, useState } from 'react';

export function ChallengeBadge() {
  const [hasClaimableChallenge, setHasClaimableChallenge] = useState(false);

  useEffect(() => {
    fetchActiveChallenge();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchActiveChallenge, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActiveChallenge = async () => {
    try {
      const response = await fetch('/api/challenges/active');
      
      if (response.status === 401) {
        setHasClaimableChallenge(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        const challenge = data.activeChallenge;
        
        if (!challenge) {
          setHasClaimableChallenge(false);
          return;
        }
        
        // Mostrar badge si hay un reto finalizado para reclamar
        if (challenge.status === 'finished') {
          setHasClaimableChallenge(true);
          return;
        }
        
        // También mostrar badge si el timer terminó aunque el estado sea 'in_progress'
        if (challenge.status === 'in_progress' && challenge.startedAt) {
          const startTime = new Date(challenge.startedAt);
          const now = new Date();
          const elapsedMs = now.getTime() - startTime.getTime();
          const elapsedMinutes = Math.floor(elapsedMs / 60000);
          const totalMinutes = challenge.durationMinutes || 60;
          
          if (elapsedMinutes >= totalMinutes) {
            setHasClaimableChallenge(true);
            return;
          }
        }
        
        setHasClaimableChallenge(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching active challenge:', error);
      }
      setHasClaimableChallenge(false);
    }
  };

  if (!hasClaimableChallenge) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-lg ring-2 ring-white/95 leading-none">
      1
    </span>
  );
}
