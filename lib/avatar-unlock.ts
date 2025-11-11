/**
 * Avatar Unlock System
 * 
 * Manages progressive unlocking of avatar categories and items
 */

import { db } from '@/db';
import { avatarCustomizations, storeItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface UnlockRequirement {
  category: string;
  requiredChallenges?: number;
  requiredStreak?: number;
  requiredLevel?: number;
  isPremiumOnly?: boolean;
}

/**
 * Category unlock requirements
 * Defines when each category becomes available
 */
export const CATEGORY_UNLOCK_REQUIREMENTS: Record<string, UnlockRequirement> = {
  color: {
    category: 'color',
    requiredChallenges: 0, // Always available
  },
  shirt: {
    category: 'shirt',
    requiredChallenges: 1, // Unlock after first challenge
  },
  hat: {
    category: 'hat',
    requiredChallenges: 5,
  },
  glasses: {
    category: 'glasses',
    requiredChallenges: 3,
  },
  background: {
    category: 'background',
    requiredChallenges: 10,
  },
  accessories: {
    category: 'accessories',
    requiredChallenges: 15,
    isPremiumOnly: true,
  },
};

/**
 * Check if user has unlocked a category
 */
export function isCategoryUnlocked(
  category: string,
  completedChallenges: number,
  isPremium: boolean
): boolean {
  const requirements = CATEGORY_UNLOCK_REQUIREMENTS[category];
  
  if (!requirements) {
    return false;
  }
  
  // Check premium requirement
  if (requirements.isPremiumOnly && !isPremium) {
    return false;
  }
  
  // Check challenges requirement
  if (requirements.requiredChallenges !== undefined) {
    if (completedChallenges < requirements.requiredChallenges) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get all unlocked categories for a user
 */
export function getUnlockedCategories(
  completedChallenges: number,
  isPremium: boolean
): string[] {
  return Object.keys(CATEGORY_UNLOCK_REQUIREMENTS).filter((category) =>
    isCategoryUnlocked(category, completedChallenges, isPremium)
  );
}

/**
 * Get unlock message for a category
 */
export function getCategoryUnlockMessage(category: string): string {
  const requirements = CATEGORY_UNLOCK_REQUIREMENTS[category];
  
  if (!requirements) {
    return '';
  }
  
  const parts: string[] = [];
  
  if (requirements.requiredChallenges !== undefined && requirements.requiredChallenges > 0) {
    parts.push(`Completa ${requirements.requiredChallenges} reto${requirements.requiredChallenges > 1 ? 's' : ''}`);
  }
  
  if (requirements.requiredStreak !== undefined) {
    parts.push(`Mantén ${requirements.requiredStreak} días de racha`);
  }
  
  if (requirements.isPremiumOnly) {
    parts.push('Requiere cuenta Premium');
  }
  
  return parts.join(' • ');
}

/**
 * Initialize free items for a new user
 */
export async function initializeFreeItems(userId: string): Promise<void> {
  try {
    // Get all free items (price = 0)
    const freeItems = await db
      .select()
      .from(storeItems)
      .where(eq(storeItems.price, 0));
    
    // Unlock each free item for the user
    const unlocks = freeItems.map((item) => ({
      userId,
      category: item.category,
      itemId: item.itemId,
      equipped: false,
      unlockedAt: new Date(),
    }));
    
    if (unlocks.length > 0) {
      await db.insert(avatarCustomizations).values(unlocks);
    }
  } catch (error) {
    console.error('Error initializing free items:', error);
    throw error;
  }
}

/**
 * Get progress towards unlocking a category
 */
export function getCategoryUnlockProgress(
  category: string,
  completedChallenges: number
): {
  unlocked: boolean;
  progress: number;
  total: number;
} {
  const requirements = CATEGORY_UNLOCK_REQUIREMENTS[category];
  
  if (!requirements) {
    return { unlocked: false, progress: 0, total: 0 };
  }
  
  const requiredChallenges = requirements.requiredChallenges || 0;
  const unlocked = completedChallenges >= requiredChallenges;
  
  return {
    unlocked,
    progress: Math.min(completedChallenges, requiredChallenges),
    total: requiredChallenges,
  };
}



