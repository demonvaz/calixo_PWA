# Frontend Guideline Document

This document outlines the frontend setup for the Calixo PWA project. It covers architecture, design principles, styling, components, state management, routing, performance, testing, and more. The goal is to give anyone—technical or not—a clear overview of how the frontend is built and why.

---

## 1. Frontend Architecture

### Overview
- **Framework**: Next.js (React-based) for hybrid static & server rendering, fast performance, and built-in routing.
- **Language**: TypeScript for type safety and clearer code.
- **UI Library**: shadcn/ui (a set of accessible React components) styled with Tailwind CSS.
- **PWA Support**: Native service worker (or Workbox) to enable offline mode, caching, and installability.
- **Data Layer**: Supabase client in Next.js API routes backed by Drizzle ORM.

### Scalability & Maintainability
- **Modular Folder Structure**: Each feature lives in its own directory (`/components`, `/features`, `/pages/api`, etc.).
- **Component-Based**: UI is broken into small, reusable React components (buttons, cards, modals).
- **TypeScript Types**: Shared types for user, challenge, avatar, etc., reduce bugs as the app grows.
- **API Routes**: Business logic and server-side calls live in `/pages/api` so frontend code stays organized.

### Performance
- **Server-Side Rendering (SSR)** for key pages (feed, profile) to improve first load.
- **Static Generation** for less-dynamic pages (marketing, info pages).
- **Lazy Loading** components and images to cut down initial bundle size.

---

## 2. Design Principles

1. **Usability**: Simple layouts, clear labels, large touch targets on mobile.
2. **Accessibility (WCAG 2.1 AA)**: Semantic HTML, proper aria attributes, keyboard navigation.
3. **Mobile-First & Responsive**: Breakpoints in Tailwind ensure layouts adapt from small phones to large screens.
4. **Feedback-Driven**: Loading spinners, toast messages, and disabled states keep users informed.
5. **Clarity & Calm**: A minimal interface with soft colors and rounded corners reduces cognitive load.

**Application**
- Forms: clear placeholder text, inline validation.
- Buttons: consistent sizes, colors, and states.
- Navigation: visible focus outlines, skip links for screen-readers.

---

## 3. Styling and Theming

### Styling Approach
- **Tailwind CSS**: Utility-first approach for rapid styling and consistent spacing.
- **shadcn/ui**: Wraps Tailwind components into pre-styled, accessible React building blocks.

### Methodology
- Use Tailwind’s atomic classes instead of custom BEM or SMACSS.
- Create design tokens in `tailwind.config.js` (colors, font sizes, spacing).
- Leverage Tailwind’s `@apply` in custom CSS files for recurrent patterns.

### Theming & Style
- **Style**: Modern flat design with subtle glassmorphism overlaps on cards and modals.
- **Color Palette**:
  - Beige (Background): #F5F0E8
  - Soft Blue (Primary): #5A8DEE
  - Neutral Gray (Text & Borders): #6B7280
  - Accent Green (Success): #22C55E
  - Accent Red (Error): #EF4444
  - Dark Navy (Headers): #1E293B

- **Typography**:
  - Primary Font: “Inter” (system-safe, rounded, modern)
  - Weight Scale: 400 (body), 500 (medium text), 700 (headings)

---

## 4. Component Structure

- **Atomic Design**:
  - **Atoms**: Buttons, inputs, avatars, icons (in `/components/atoms`).
  - **Molecules**: Form fields, cards, nav items (in `/components/molecules`).
  - **Organisms**: Header, feed list, user profile section (in `/components/organisms`).
  - **Pages**: Pages in `/pages` folder import organisms.

- **Reusability**:
  - Each component has its own folder with `.tsx`, `.test.tsx`, and a module CSS or styled file.
  - Props are strictly typed in TypeScript for clarity.

**Benefit**: Adding or updating a UI piece doesn’t impact unrelated parts of the app.

---

## 5. State Management

### Server State
- **React Query** (or SWR) for data fetching, caching, revalidation from Supabase endpoints.
  - Automatically handles loading, success, and error states.
  - Background re-fetch when network is back.

### Client State
- **Auth Context**: React Context to store user session, role (normal, premium, admin), and token.
- **UI Context**: Modal visibility, theme toggles, in-app notifications.
- **Local Challenge Session**: `useReducer` to track focus challenge start/stop events and visibility changes.

### Flow
1. On app load, React Query fetches current user from `/api/auth`.
2. Auth Context provides user data to all components.
3. Components use React Query hooks for posts, feed, profile, etc.
4. Local UI state lives in context or component-level hooks.

---

## 6. Routing and Navigation

- **Next.js File-Based Routing**:
  - `/pages/index.tsx` for the feed.
  - `/pages/challenges/[id].tsx` for challenge detail.
  - `/pages/profile/[username].tsx` for user profiles.
  - `/pages/admin/*` for admin and moderator panel.

- **Dynamic Routes**: Use `getStaticPaths` or `getServerSideProps` for dynamic data.

- **Linking**: Use `next/link` for client-side transitions.
- **Programmatic Navigation**: Use `next/router` for redirects after login, logout, or challenge start.

---

## 7. Performance Optimization

1. **Code Splitting**: Automatic by Next.js; manual via dynamic `import()` for heavy components.
2. **Lazy Loading**: Images with `next/image`, components with `React.lazy`.
3. **Service Worker Caching**: Cache shell, static assets, and recent feed entries with `stale-while-revalidate`.
4. **Asset Optimization**: SVG icons, compressed PNG/JPEG/WEBP via Supabase storage webhooks.
5. **Memoization**: `React.memo` for pure components, `useMemo` and `useCallback` to prevent unnecessary re-renders.
6. **Bundle Analysis**: Periodic checks with `next-bundle-analyzer`.

---

## 8. Testing and Quality Assurance

- **Unit Tests**: Jest + React Testing Library for components. Focus on rendering, props, event handlers.
- **Integration Tests**: Test flows like login → feed fetch → challenge start using React Testing Library with mocked Supabase.
- **E2E Tests**: Cypress for end-to-end flows (install PWA, offline mode, challenge completion, avatar store).
- **Accessibility Tests**: axe-core integration in Jest to catch WCAG violations.
- **Linting & Formatting**: ESLint (with TypeScript rules), Prettier for consistent code style.
- **CI/CD**: GitHub Actions runs lint, tests, and builds on each pull request.

---

## 9. Conclusion and Overall Frontend Summary

Calixo’s frontend is a modern, scalable Next.js PWA built with React, TypeScript, Tailwind CSS, and shadcn/ui. It follows a clear component-based structure, strong design principles (usability, accessibility, mobile-first), and robust state management with React Query and Context. Offline support, performance optimizations, and thorough testing ensure a smooth, reliable user experience. Together, these guidelines align the team on a consistent approach, reducing confusion and speeding up development as Calixo grows.

Let’s build a calm, engaging, and accessible app for digital disconnection!