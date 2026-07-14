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
  email?: string | null;
  gender?: 'femenino' | 'masculino' | 'no_responder' | null;
  birthDate?: string | null;
}

// Challenge related types
export type ChallengeType = 'daily' | 'focus' | 'social' | 'group';
export type ChallengeStatus = 'pending' | 'in_progress' | 'finished' | 'claimed' | 'completed' | 'failed' | 'canceled' | 'not_claimed';

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

// Messaging types
export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface ReadReceiptUser {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  readAt?: string | null;
}

export interface ConversationPreview {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    displayName: string;
    profilePhotoPath?: string | null;
    isPremium?: boolean;
  } | null;
  lastMessage: {
    id: number;
    content: string;
    senderId: string;
    status: MessageStatus;
    createdAt: string;
    isOwn: boolean;
  } | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  senderId: string;
  senderName?: string;
  content: string;
  imageUrl?: string | null;
  status?: MessageStatus;
  createdAt: string;
  isOwn: boolean;
  readBy?: ReadReceiptUser[];
}

// Group types
export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  displayName?: string;
  profilePhotoPath?: string | null;
  profilePhotoUrl?: string | null;
  isPremium?: boolean;
}

export interface GroupDetail {
  id: string;
  name: string;
  description?: string | null;
  avatarPath?: string | null;
  createdBy?: string;
  updatedAt?: string;
  myRole: 'admin' | 'member';
  myUserId: string;
  members: GroupMember[];
}

export interface GroupPreview {
  id: string;
  name: string;
  description?: string | null;
  avatarPath?: string | null;
  memberCount: number;
  role?: string;
  updatedAt: string;
  lastMessage: {
    content: string;
    createdAt: string;
    isOwn: boolean;
  } | null;
  unreadCount: number;
}

export interface GroupChallengeParticipant {
  userId: string;
  displayName?: string;
  betAmount: number;
  status: string;
  failedAt?: string | null;
  isMe?: boolean;
}

export interface GroupChallenge {
  id: string;
  groupId: string;
  organizerId: string;
  durationMinutes: number;
  status: string;
  baseReward: number;
  totalPot: number;
  weekKey: string;
  startedAt?: string | null;
  endedAt?: string | null;
  participants?: GroupChallengeParticipant[];
}

export interface GroupMemberStats {
  userId: string;
  displayName: string;
  wins: number;
  losses: number;
  totalEarned: number;
  successRate: number;
}

export interface GroupStats {
  totalChallenges: number;
  completedChallenges: number;
  totalCoinsDistributed: number;
  activeChallenge: GroupChallenge | null;
  ranking: GroupMemberStats[];
  recentChallenges: unknown[];
}

