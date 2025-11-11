'use client';

import { useEffect, useState } from 'react';

export function NotificationBadge() {
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    fetchUnseenCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnseenCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnseenCount = async () => {
    try {
      const response = await fetch('/api/notifications?unseenOnly=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        setUnseenCount(data.unseenCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unseen count:', error);
    }
  };

  if (unseenCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {unseenCount > 9 ? '9+' : unseenCount}
    </span>
  );
}



