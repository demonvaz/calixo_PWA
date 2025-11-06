# Project Requirements Document (PRD)

## 1. Project Overview

Calixo is a Progressive Web App (PWA) designed as a social platform for digital detox in Spanish. Users take on daily, focus and social “challenges” (retos) to disconnect from screens and earn in-app currency. They customize a friendly avatar called CALI, share their progress in a feed, follow others, and maintain streaks. A simple honor-system (visibilitychange events) validates challenge completion, while Supabase handles authentication, storage and data.

We’re building Calixo to encourage healthier tech habits through gamification and community. Success means a responsive, mobile-first PWA that works offline, meets WCAG 2.1 AA accessibility, handles free and premium users seamlessly, and provides a basic admin panel for moderation, configuration and Stripe-based subscriptions. The first version must be organized, typed (TypeScript), and ready for a Supabase backend connection.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (v1)

*   **Authentication & Roles**

    *   Email/password and Google OAuth
    *   Two roles: Normal user and Premium (isPremium flag, blue tick)

*   **PWA Essentials**

    *   `manifest.json`, Service Worker (Workbox or custom)
    *   Offline shell, asset caching, feed caching (stale-while-revalidate), `/offline` screen
    *   Installation prompt

*   **Retos (Challenges)**

    *   Daily retos (1 free/day, 3 for premium) from rotating catalog
    *   Focus mode retos (user-tunable, max 23 h)
    *   Social retos (user-created, invite friends, individual counters)
    *   Honor-system validation via visibilitychange, session events to backend
    *   Automatic reset or cancel on failure (before 23 h or tab blur)

*   **Avatar CALI & Store**

    *   Base color editor; progressive unlock of categories (e.g., shirt, background)
    *   In-app currency earned per reto; configurable rewards
    *   Store interface showing all items, premiumOnly flagged, purchase flow

*   **Feed & Profiles**

    *   Feed of completed retos with square image + note, premium badge, energy level
    *   Profiles with CALI avatar, counters, streaks, hitos, followers/following
    *   Default public profiles; private toggle hides retos/photos/stats from non-followers

*   **Notifications**

    *   In-app notifications panel
    *   Optional Web Push via Service Worker; user can enable/disable

*   **Subscription & Payments**

    *   Stripe integration: €2.99/month, €26.99/year + coupon codes management
    *   Back-end webhook endpoint for Stripe events; admin UI for logs/actions

*   **Admin Panel**

    *   Two modes (ADMIN vs MODERATOR) switchable in UI
    *   ADMIN: manage retos, rewards, global limits, users, subscriptions, coupons
    *   MODERATOR: review reported content, hide comments/photos, warn/expel users

*   **Internationalization Setup**

    *   Spanish default; i18n framework in place for future languages (no content translation now)

*   **Accessibility & Design**

    *   WCAG 2.1 AA compliance baseline
    *   Responsive web & mobile-first, minimal Beige+Soft Blue palette, friendly rounded font

### Out-of-Scope (v1)

*   Full multi-language content (beyond Spanish defaults)
*   Advanced analytics or machine-learning personalization
*   Deep background timers on iOS (limited by browser)
*   Direct calendar integrations or external APIs beyond Supabase & Stripe
*   Native mobile apps (only PWA)
*   Real-time chat or voice/video features

## 3. User Flow

When a new user lands on Calixo, they see a welcome screen with options to sign up via email/password or “Continue with Google.” On first login, they choose a base color for their CALI avatar in a brief tutorial, then land on the main feed showing retos completed by people they follow. A top bar displays the CALI avatar, a notifications bell, and a menu for profile, settings and admin (if applicable). A bottom or side nav gives quick access to Daily, Focus and Social retos, the Store, and Profile.

To start a daily reto, the user taps “Daily,” sees today’s challenge from the rotating catalog, and presses “Start.” The app sends a `session_start` event, tracks `visibilitychange`, and upon completion before tab blur, shows a success form to upload a 1:1 photo (max 5 MB, JPG/PNG/WEBP, auto-resize) and add a note. Coins are credited and the user can share the post to their feed. In Settings they can toggle profile privacy, manage notifications (in-app vs push), view subscription status or upgrade via Stripe. Offline, the UI shows cached feed entries and a friendly offline page for missing content.

## 4. Core Features

*   **Authentication**

    *   Email/password & Google OAuth
    *   Normal vs Premium flags, blue verification badge

*   **PWA Setup**

    *   `manifest.json`, installer prompt, offline fallbacks
    *   Service Worker caching strategies (app shell, assets, feed)

*   **Retos System**

    *   Daily (1 free/3 premium), Focus (user-defined ≤23 h), Social (invite, group view)
    *   Honor-system using visibilitychange & session events
    *   Automatic reset/cancel logic and 5 AM daily rollover

*   **Avatar CALI**

    *   Layered PNG/SVG composition: energyLevel, base color, categories, accessories
    *   Energy levels (alta/media/baja) driven by activity
    *   Editor UI with locked/unlocked categories

*   **In-App Currency & Store**

    *   Configurable rewards, premiumOnly items
    *   Transaction flow, category unlock logic

*   **Social Feed & Profiles**

    *   Post reto completions with image & note
    *   Profiles with counters, hitos, followers, privacy toggle

*   **Notifications**

    *   In-app panel and optional Web Push via Service Worker

*   **Subscriptions & Payments**

    *   Stripe monthly/annual plans, coupon codes, webhook processing

*   **Admin Panel**

    *   Dual mode UI (ADMIN / MODERATOR)
    *   CRUD retos, rewards config, coupons, review user sessions, moderation queue

*   **Accessibility & Responsive Design**

    *   WCAG 2.1 AA, keyboard nav, screen-reader labels, reduced-motion support

## 5. Tech Stack & Tools

*   Frontend: Next.js, React, TypeScript, TailwindCSS, shadcn/ui
*   Backend / Database: Supabase Auth, Supabase Database, Supabase Storage
*   ORM: Drizzle ORM
*   Payments: Stripe SDK + secure webhook endpoint
*   PWA: Workbox (or native SW), `manifest.json`
*   i18n: next-i18next or comparable
*   Dev & Deployment: Docker, Vercel or similar hosting
*   Testing & Linting: ESLint, Prettier, GitHub Actions CI
*   Accessibility: axe-core integration for audits

## 6. Non-Functional Requirements

*   **Performance**

    *   First contentful paint < 2s on 3G; API responses < 200 ms
    *   Caching feed & assets to reduce Supabase calls

*   **Security & Compliance**

    *   HTTPS everywhere, signed URLs for image access
    *   GDPR-friendly (opt-in notifications, data deletion upon request)
    *   Input validation, typed error handling in all endpoints

*   **Accessibility**

    *   WCAG 2.1 AA: contrast ratios ≥ 4.5:1, keyboard-only navigation, ARIA labels
    *   Respect `prefers-reduced-motion`

*   **Usability**

    *   Mobile-first, responsive breakpoints for phone/tablet/desktop
    *   Clear onboarding, error messages, success toasts

## 7. Constraints & Assumptions

*   Supabase services (Auth, DB, Storage) are available and performant
*   Stripe webhooks must be verified server-side (secret key)
*   iOS background timers cannot be relied upon for Focus mode; we assume honor-system suffices
*   Users speak Spanish; future translation via i18n layer but not in v1
*   Admin panel uses one user object with UI switch between ADMIN/MODERATOR

## 8. Known Issues & Potential Pitfalls

*   **iOS timers**: browser throttles background JS; we must clearly warn users that leaving the tab resets Focus retos.
*   **Supabase cost**: unbounded reads can spike costs—use daily caching and pagination.
*   **Push permissions**: users may deny; fallback to in-app only messaging.
*   **Image uploads**: large files can time out—enforce client-side resize (1080 px max) and 5 MB limit.
*   **Concurrent edits**: CALI store unlocks and selections should be serialized to prevent race conditions.
*   **Stripe webhooks**: duplicate event delivery; idempotency in backend handling needed.

This document is the authoritative source for all subsequent technical specs (Tech Stack Doc, Frontend Guidelines, Backend Structure, etc.). Every feature, endpoint and UI component in those docs must trace back clearly to these requirements.
