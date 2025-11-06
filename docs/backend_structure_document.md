# Backend Structure Document

## 1. Backend Architecture

The backend for Calixo is built as a set of serverless API routes within a Next.js application. Here’s how it’s put together and why it works well:

*   **Framework & Patterns**

    *   Next.js API routes (route handlers) act as serverless functions.
    *   Drizzle ORM handles all database interactions in a type-safe way.
    *   Stripe webhooks are handled in a dedicated endpoint.
    *   OpenAI integration for content moderation runs in its own service module.

*   **How It Scales**

    *   Serverless API routes auto-scale with traffic—no manual server provisioning.
    *   Supabase (PostgreSQL + Auth + Storage) scales vertically and horizontally behind the scenes.
    *   Docker is used for local development parity.

*   **Maintainability & Performance**

    *   Clear separation of concerns: authentication, business logic, data access, third-party integrations.
    *   Typed code (TypeScript) reduces runtime errors and accelerates onboarding.
    *   CI/CD with GitHub Actions ensures consistent builds and automatic deployments.

## 2. Database Management

*   **Technology**

    *   Supabase-hosted PostgreSQL database (SQL).
    *   Supabase Auth for user management (OAuth + email/password).
    *   Supabase Storage for images and media.

*   **Data Practices**

    *   Row-level security (RLS) policies in PostgreSQL to enforce access control.
    *   Drizzle ORM migrations track schema changes alongside code.
    *   Images are uploaded to Supabase Storage and served via signed URLs.
    *   Database backups and point-in-time recovery managed by Supabase.

## 3. Database Schema

Below is a human-readable outline of the main tables, followed by SQL definitions.

### Human-Readable Schema

1.  **users**: Core auth records (id, email, created_at).
2.  **profiles**: Extended user info (display name, avatar energy, public/private flag).
3.  **challenges**: Master list of challenge templates (type, title, description, reward).
4.  **user_challenges**: Logs of user attempts and completions (status, timestamps).
5.  **focus_sessions**: Records of focus challenge runs (duration, interruptions).
6.  **social_sessions**: Shared challenge invites and acceptances.
7.  **avatar_customizations**: Tracks unlocked and equipped cosmetic items per user.
8.  **store_items**: In-app currency items (price, premium_only flag).
9.  **transactions**: Currency transactions and purchases.
10. **followers**: Follower/following relationships between users.
11. **feed_items**: Posts showing completed challenges (image URL, note).
12. **notifications**: In-app and push notifications (type, seen flag).
13. **subscriptions**: Stripe subscription records (status, plan).
14. **coupons**: Promotional codes (discount, expiry).
15. **admin_users**: Users with ADMIN or MODERATOR roles.
16. **config**: Runtime configuration for limits and reward values.

### SQL Schema (PostgreSQL)

`-- 1. Users CREATE TABLE users ( id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() ); -- 2. Profiles CREATE TABLE profiles ( user_id UUID PRIMARY KEY REFERENCES users(id), display_name TEXT, avatar_energy INTEGER DEFAULT 100, is_private BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() ); -- 3. Challenges CREATE TABLE challenges ( id SERIAL PRIMARY KEY, type TEXT NOT NULL, -- daily, focus, social title TEXT NOT NULL, description TEXT, reward INTEGER NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() ); -- 4. User Challenges CREATE TABLE user_challenges ( id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), challenge_id INTEGER REFERENCES challenges(id), status TEXT NOT NULL, -- pending, completed, failed started_at TIMESTAMP WITH TIME ZONE, completed_at TIMESTAMP WITH TIME ZONE ); -- 5. Focus Sessions CREATE TABLE focus_sessions ( id SERIAL PRIMARY KEY, user_challenge_id INTEGER REFERENCES user_challenges(id), duration INTEGER NOT NULL, -- in seconds interruptions INTEGER DEFAULT 0 ); -- 6. Social Sessions CREATE TABLE social_sessions ( id SERIAL PRIMARY KEY, inviter_id UUID REFERENCES users(id), invitee_id UUID REFERENCES users(id), challenge_id INTEGER REFERENCES challenges(id), accepted_at TIMESTAMP WITH TIME ZONE, completed_at TIMESTAMP WITH TIME ZONE ); -- 7. Avatar Customizations CREATE TABLE avatar_customizations ( id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), category TEXT NOT NULL, -- e.g., color, hat, glasses item_id TEXT NOT NULL, unlocked_at TIMESTAMP WITH TIME ZONE, equipped BOOLEAN DEFAULT FALSE ); -- 8. Store Items CREATE TABLE store_items ( id SERIAL PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL, premium_only BOOLEAN DEFAULT FALSE ); -- 9. Transactions CREATE TABLE transactions ( id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), item_id INTEGER REFERENCES store_items(id), amount INTEGER NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() ); -- 10. Followers CREATE TABLE followers ( follower_id UUID REFERENCES users(id), following_id UUID REFERENCES users(id), followed_at TIMESTAMP WITH TIME ZONE DEFAULT now(), PRIMARY KEY (follower_id, following_id) ); -- 11. Feed Items CREATE TABLE feed_items ( id SERIAL PRIMARY KEY, user_challenge_id INTEGER REFERENCES user_challenges(id), image_url TEXT, note TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() ); -- 12. Notifications CREATE TABLE notifications ( id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), type TEXT NOT NULL, -- reward, social, system payload JSONB, seen BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT now() ); -- 13. Subscriptions CREATE TABLE subscriptions ( id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id), stripe_subscription_id TEXT UNIQUE, status TEXT NOT NULL, plan TEXT, current_period_end TIMESTAMP WITH TIME ZONE ); -- 14. Coupons CREATE TABLE coupons ( id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, discount_percent INTEGER, valid_until TIMESTAMP WITH TIME ZONE ); -- 15. Admin Users CREATE TABLE admin_users ( user_id UUID PRIMARY KEY REFERENCES users(id), role TEXT NOT NULL -- ADMIN, MODERATOR ); -- 16. Config CREATE TABLE config ( key TEXT PRIMARY KEY, value JSONB NOT NULL );`

## 4. API Design and Endpoints

The backend exposes RESTful endpoints via Next.js route handlers. Key routes:

*   **/api/auth/**

    *   Handles sign-up, sign-in, token refresh via Supabase Auth.

*   **/api/user/profile**

    *   GET: Fetch profile data.
    *   PATCH: Update display name, privacy.

*   **/api/challenges/**

    *   GET `/api/challenges`: List available challenges (daily, focus, social).
    *   POST `/api/challenges/start`: Begin a challenge session.

*   **/api/user/challenges/**

    *   GET: User’s current/past challenges.
    *   POST `/complete`: Mark a challenge completed.

*   **/api/focus-sessions/**

    *   POST: Log focus session interruptions and duration.

*   **/api/social-sessions/**

    *   POST: Invite a friend.
    *   POST `/accept`: Accept invitation.

*   **/api/avatar/**

    *   GET: Current avatar state.
    *   POST `/customize`: Unlock/equip items.

*   **/api/store/**

    *   GET: Available store items.
    *   POST `/purchase`: Buy an item (records transaction).

*   **/api/follow/**

    *   POST `/toggle`: Follow/unfollow a user.

*   **/api/feed/**

    *   GET: Fetch feed posts (paginated).
    *   POST: Create a feed post after challenge completion.

*   **/api/notifications/**

    *   GET: List user notifications.
    *   POST `/mark-seen`: Mark notifications as read.

*   **/api/stripe/webhook**

    *   POST: Secure endpoint to handle subscription events (checkout.session.completed, invoice.paid, customer.subscription.updated).

*   **/api/config**

    *   GET: Public runtime configuration (limits, reward values).

*   **/api/admin/**

    *   Protected by ADMIN/MODERATOR roles.
    *   CRUD for challenges, coupons, users, and review feed posts.

## 5. Hosting Solutions

*   **Next.js on Vercel**

    *   Global Edge network for low-latency API responses.
    *   Auto-scaling serverless functions.
    *   Built-in HTTPS and CDN for static assets.

*   **Supabase**

    *   Managed PostgreSQL database with continuous backups and RLS.
    *   Built-in Auth and Storage services.

*   **Stripe**

    *   Hosted billing and subscription management.

*   **GitHub Actions**

    *   CI/CD pipeline for testing, linting, and deployment to Vercel.

## 6. Infrastructure Components

*   **Load Balancer & Edge Network**

    *   Vercel’s global edge for API route distribution.

*   **Caching**

    *   Next.js ISR/SSG for public pages.
    *   Workbox service worker on the client for runtime caching of shell, assets, and feed.
    *   Supabase CDN for Storage assets.

*   **Content Delivery Network (CDN)**

    *   Vercel CDN for static files and images.
    *   Supabase Storage CDN for user-uploaded media.

*   **Containerization (local)**

    *   Docker + docker-compose for local PostgreSQL and service parity.

## 7. Security Measures

*   **Authentication & Authorization**

    *   Supabase Auth issues JWTs for clients.
    *   Role-based checks in API routes (user vs. premium vs. admin/moderator).
    *   Row-level security policies in PostgreSQL.

*   **Data Encryption**

    *   TLS everywhere (Vercel, Supabase).
    *   Encryption at rest on Supabase database and storage.

*   **Webhook Verification**

    *   Stripe signature checks for incoming webhook requests.

*   **Input Validation**

    *   Typed schemas on all endpoints.
    *   Sanitization of user-generated content.

*   **Content Moderation**

    *   OpenAI automated checks on feed post text.
    *   Manual moderation via admin panel.

*   **Compliance**

    *   GDPR-compatible data handling.
    *   WCAG 2.1 AA compliance for accessibility.

## 8. Monitoring and Maintenance

*   **Logging & Alerts**

    *   Vercel and Supabase logs aggregated in a logging dashboard.
    *   Sentry (or similar) for runtime error tracking.

*   **Performance Monitoring**

    *   Vercel Analytics for route performance.
    *   Supabase dashboard for query performance and slow logs.

*   **CI/CD**

    *   Automated test suite (unit + integration) runs on GitHub Actions.
    *   Linting and type checks on every PR.

*   **Maintenance Strategy**

    *   Scheduled database backups and schema migration reviews.
    *   Quarterly dependency audits and security patching.

## 9. Conclusion and Overall Backend Summary

Calixo’s backend is a modern, serverless stack built on Next.js, Supabase, and Drizzle ORM. It offers:

*   **Scalability** through serverless functions and a managed database.
*   **Security** via JWTs, RLS, encrypted transport, and webhook verification.
*   **Maintainability** with TypeScript, clear separation of concerns, and CI/CD.
*   **Performance** through edge-deployed APIs and layered caching.

Unique strengths include the honor-system challenge validation, progressive avatar customization, and built-in content moderation with OpenAI. Overall, this setup meets Calixo’s goals for a responsive, reliable, and secure social PWA experience in Spanish and beyond.
