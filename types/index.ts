/**
 * Type definitions for Calixo PWA
 */

// User related types
export type UserRole = 'normal' | 'premium' | 'admin' | 'moderator';

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Profile {
  userId: string;
  displayName: string;
  avatarEnergy: number;
  isPrivate: boolean;
  isPremium: boolean;
  createdAt: Date;
}

// Challenge related types
export type ChallengeType = 'daily' | 'focus' | 'social';
export type ChallengeStatus = 'pending' | 'in_progress' | 'finished' | 'claimed' | 'completed' | 'failed' | 'canceled';

export interface Challenge {
  id: number;
  type: ChallengeType;
  title: string;
  description: string;
  reward: number;
  createdAt: Date;
}

export interface UserChallenge {
  id: number;
  userId: string;
  challengeId: number;
  status: ChallengeStatus;
  startedAt?: Date;
  finishedAt?: Date;
  claimedAt?: Date;
  completedAt?: Date;
  shared?: boolean;
}

// Avatar related types
export type AvatarCategory = 'color' | 'shirt' | 'background' | 'hat' | 'glasses' | 'accessories';
export type EnergyLevel = 'alta' | 'media' | 'baja';

export interface AvatarCustomization {
  id: number;
  userId: string;
  category: AvatarCategory;
  itemId: string;
  unlockedAt: Date;
  equipped: boolean;
}

// Store related types
export interface StoreItem {
  id: number;
  name: string;
  category: AvatarCategory;
  price: number;
  premiumOnly: boolean;
  imageUrl?: string;
}

export interface Transaction {
  id: number;
  userId: string;
  itemId: number;
  amount: number;
  createdAt: Date;
}

// Social related types
export interface FeedItem {
  id: number;
  userChallengeId: number;
  userId: string;
  displayName: string;
  imageUrl?: string;
  note?: string;
  isPremium: boolean;
  avatarEnergy: number;
  createdAt: Date;
}

export interface Follower {
  followerId: string;
  followingId: string;
  followedAt: Date;
}

// Notification types
export type NotificationType = 'reward' | 'social' | 'system' | 'challenge';

export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  seen: boolean;
  createdAt: Date;
}

// Subscription types
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';
export type SubscriptionPlan = 'monthly' | 'annual';

export interface Subscription {
  id: number;
  userId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  currentPeriodEnd: Date;
}

// Admin types
export interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  validUntil: Date;
}

export interface AdminUser {
  userId: string;
  role: 'admin' | 'moderator';
}

// Config types
export interface Config {
  key: string;
  value: Record<string, unknown>;
}

