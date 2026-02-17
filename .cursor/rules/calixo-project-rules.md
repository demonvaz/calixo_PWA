# Calixo Project Rules

## Project Context
This is the Calixo PWA - a social platform for digital detox in Spanish. Users complete challenges (retos), customize their CALI avatar, earn coins, and share progress.

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (Auth, DB, Storage), PostgreSQL
- Payments: Stripe
- PWA: Workbox, Service Worker, manifest.json

## Code Style Guidelines

### TypeScript
- Always use TypeScript with strict mode
- Define types in `/types/index.ts`
- Use interfaces for objects, types for unions/primitives
- Prefer explicit return types for functions

### React Components
- Use functional components with hooks
- Place UI components in `/components/ui/`
- Place feature components in `/components/{feature}/`
- Use React.forwardRef for components that need ref forwarding
- Always include displayName for debugging

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Functions/variables: camelCase (e.g., `getUserData`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- Files: kebab-case for utils, PascalCase for components

### Styling
- Use Tailwind CSS utility classes
- Custom colors from theme: `beige`, `soft-blue`, `neutral-gray`, etc.
- Use `cn()` utility from `/lib/utils.ts` to merge classes
- Prefer `rounded-xl` and `rounded-2xl` for consistency
- Mobile-first responsive design

### Database
- Todo por Supabase: Auth, Database, Storage
- Usar cliente Supabase (`createClient`, `createServiceRoleClient`) para todas las operaciones de BD
- Migraciones en Supabase (SQL)
- RLS (Row-Level Security) para control de acceso

### API Routes
- Place in `/app/api/` directory
- Always validate input with Zod schemas
- Return typed responses
- Use proper HTTP status codes
- Handle errors with try-catch

### Accessibility
- WCAG 2.1 AA compliance
- Include aria-labels where appropriate
- Ensure keyboard navigation works
- Contrast ratios ≥ 4.5:1
- Support `prefers-reduced-motion`

### Security
- Never commit secrets or API keys
- Validate all user input
- Sanitize content before rendering
- Use signed URLs for private images
- Verify Stripe webhooks with signatures

## File Structure
```
app/          - Next.js App Router pages
components/   - React components
lib/          - Utility functions
lib/supabase/ - Cliente Supabase y helpers
types/        - TypeScript type definitions
public/       - Static assets
docs/         - Project documentation
```

## Spanish Language
- UI text in Spanish by default
- Use proper Spanish grammar and accents
- Variables/code in English
- Comments can be in English or Spanish

## Implementation Phases
Follow the implementation plan in `/docs/security_guideline_document.md`:
1. Project Setup ✅
2. Authentication
3. Database & Schema
4. Challenges System
5. Avatar CALI
6. In-app Currency & Store
7. Social Feed & Profiles
8. Stripe Subscriptions
9. Notifications
10. Admin Panel
11. PWA Features
12. Accessibility & i18n
13. CI/CD & Deployment

## Best Practices
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use async/await instead of .then()
- Handle loading and error states in UI
- Test responsive design at multiple breakpoints

