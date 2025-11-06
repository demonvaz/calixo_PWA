import { pgTable, uuid, text, timestamp, integer, boolean, serial, jsonb, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

// Enums
export const challengeTypeEnum = pgEnum('challenge_type', ['daily', 'focus', 'social']);
export const challengeStatusEnum = pgEnum('challenge_status', ['pending', 'in_progress', 'completed', 'failed']);
export const notificationTypeEnum = pgEnum('notification_type', ['reward', 'social', 'system', 'challenge']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'unpaid']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['monthly', 'annual']);
export const adminRoleEnum = pgEnum('admin_role', ['admin', 'moderator']);
export const avatarCategoryEnum = pgEnum('avatar_category', ['color', 'shirt', 'background', 'hat', 'glasses', 'accessories']);

// Users table (managed by Supabase Auth, extended here)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Profiles table
export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  avatarEnergy: integer('avatar_energy').default(100).notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  coins: integer('coins').default(0).notNull(),
  streak: integer('streak').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Challenges table
export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  type: challengeTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  reward: integer('reward').notNull(),
  durationMinutes: integer('duration_minutes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Challenges table
export const userChallenges = pgTable('user_challenges', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  challengeId: integer('challenge_id').references(() => challenges.id).notNull(),
  status: challengeStatusEnum('status').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  failedAt: timestamp('failed_at'),
  sessionData: jsonb('session_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Focus Sessions table
export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  userChallengeId: integer('user_challenge_id').references(() => userChallenges.id, { onDelete: 'cascade' }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  interruptions: integer('interruptions').default(0).notNull(),
  completedSuccessfully: boolean('completed_successfully').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Social Sessions table
export const socialSessions = pgTable('social_sessions', {
  id: serial('id').primaryKey(),
  inviterId: uuid('inviter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  inviteeId: uuid('invitee_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  challengeId: integer('challenge_id').references(() => challenges.id).notNull(),
  status: challengeStatusEnum('status').default('pending').notNull(),
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Avatar Customizations table
export const avatarCustomizations = pgTable('avatar_customizations', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: avatarCategoryEnum('category').notNull(),
  itemId: text('item_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  equipped: boolean('equipped').default(false).notNull(),
});

// Store Items table
export const storeItems = pgTable('store_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: avatarCategoryEnum('category').notNull(),
  itemId: text('item_id').unique().notNull(),
  price: integer('price').notNull(),
  premiumOnly: boolean('premium_only').default(false).notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'earn' or 'spend'
  amount: integer('amount').notNull(),
  itemId: integer('item_id').references(() => storeItems.id),
  challengeId: integer('challenge_id').references(() => challenges.id),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Followers table (many-to-many relationship)
export const followers = pgTable('followers', {
  followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followedAt: timestamp('followed_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
}));

// Feed Items table
export const feedItems = pgTable('feed_items', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userChallengeId: integer('user_challenge_id').references(() => userChallenges.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text('image_url'),
  note: text('note'),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  payload: jsonb('payload'),
  seen: boolean('seen').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  status: subscriptionStatusEnum('status').notNull(),
  plan: subscriptionPlanEnum('plan').notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Coupons table
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(),
  discountPercent: integer('discount_percent').notNull(),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0).notNull(),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validUntil: timestamp('valid_until').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Admin Users table
export const adminUsers = pgTable('admin_users', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  role: adminRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Config table
export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reports table (for content moderation)
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reportedUserId: uuid('reported_user_id').references(() => users.id, { onDelete: 'cascade' }),
  feedItemId: integer('feed_item_id').references(() => feedItems.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status').default('pending').notNull(), // pending, reviewed, resolved
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

