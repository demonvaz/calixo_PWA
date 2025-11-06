# Authentication Implementation Guide

## Overview

Calixo uses **Supabase Auth** for secure authentication with support for:
- Email/Password authentication
- Google OAuth
- Session management with middleware
- Protected routes
- Password reset functionality

## Architecture

### Components

1. **Server-Side Client** (`lib/supabase/server.ts`)
   - Used in Server Components, Server Actions, and Route Handlers
   - Handles cookie-based session management
   - Provides secure access to user data

2. **Client-Side Client** (`lib/supabase/client.ts`)
   - Used in Client Components
   - Manages authentication state in the browser
   - Handles real-time auth state changes

3. **Middleware** (`lib/supabase/middleware.ts`, `middleware.ts`)
   - Refreshes user sessions automatically
   - Protects routes from unauthorized access
   - Redirects based on authentication state

## Routes

### Public Routes
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Sign up page
- `/auth/callback` - OAuth callback handler

### Protected Routes (require authentication)
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/challenges/*` - Challenge pages
- `/admin/*` - Admin panel (requires admin role)

## Authentication Flow

### Sign Up Flow

1. User fills out sign up form (`/auth/signup`)
2. Form data validated with Zod schema
3. Server Action `signup()` creates new Supabase user
4. Email verification sent (if enabled)
5. User redirected to login or dashboard
6. Profile record created in database

### Login Flow

1. User enters credentials (`/auth/login`)
2. Form data validated
3. Server Action `login()` authenticates with Supabase
4. Session cookie set
5. User redirected to dashboard
6. Middleware maintains session

### OAuth Flow (Google)

1. User clicks "Continue with Google"
2. Server Action `signInWithGoogle()` initiates OAuth
3. User redirected to Google consent screen
4. Google redirects back to `/auth/callback`
5. Callback handler exchanges code for session
6. User redirected to dashboard

### Logout Flow

1. User clicks logout button
2. Server Action `signOut()` called
3. Session cleared from cookies
4. User redirected to login page

## Validation

All auth forms use Zod schemas for validation (`lib/validations/auth.ts`):

### Login Schema
```typescript
{
  email: string (valid email format)
  password: string (min 8 characters)
}
```

### Signup Schema
```typescript
{
  email: string (valid email format)
  password: string (min 8, uppercase + lowercase + number)
  confirmPassword: string (must match password)
  displayName: string (3-50 characters)
  acceptTerms: boolean (must be true)
}
```

## Security Features

1. **Row-Level Security (RLS)**
   - Database policies enforce access control
   - Users can only access their own data

2. **Secure Cookies**
   - HttpOnly cookies prevent XSS attacks
   - Secure flag ensures HTTPS-only transmission
   - SameSite=Lax prevents CSRF attacks

3. **Password Requirements**
   - Minimum 8 characters
   - Must contain uppercase and lowercase
   - Must contain at least one number

4. **Session Management**
   - Automatic session refresh via middleware
   - Session expiration after inactivity
   - Secure token storage

## Usage Examples

### Protecting a Page (Server Component)

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <div>Protected content for {user.email}</div>;
}
```

### Using Auth in Client Component

```typescript
'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return <div>User: {user?.email}</div>;
}
```

### Creating a Protected API Route

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ data: 'protected data' });
}
```

## Environment Variables

Required environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

### Users Table
Managed by Supabase Auth. Extended with:
- `id` (UUID, primary key)
- `email` (text, unique)
- `created_at` (timestamp)

### Profiles Table
Custom table for additional user data:
- `user_id` (UUID, references auth.users)
- `display_name` (text)
- `avatar_energy` (integer)
- `is_private` (boolean)
- `is_premium` (boolean)
- `coins` (integer)
- `streak` (integer)

## Error Handling

Authentication errors are handled gracefully:

1. **Invalid Credentials**
   - User-friendly message displayed
   - No information leak about email existence

2. **Validation Errors**
   - Specific field-level errors
   - Clear instructions for correction

3. **Network Errors**
   - Generic error message
   - Retry option provided

## Testing

To test authentication:

1. **Local Development**
   ```bash
   # Start dev server
   npm run dev
   
   # Navigate to http://localhost:3000
   # Click "Comenzar Ahora" to sign up
   ```

2. **Test Accounts**
   - Create test users via signup page
   - Use Supabase dashboard to manage test users

3. **OAuth Testing**
   - Configure Google OAuth in Supabase dashboard
   - Add authorized redirect URIs
   - Test with real Google account

## Troubleshooting

### Issue: "Invalid Credentials" on valid login
- Check Supabase project URL and keys
- Verify user exists in Supabase dashboard
- Check browser console for errors

### Issue: OAuth callback fails
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check authorized redirect URIs in Google Console
- Ensure callback route is properly configured

### Issue: Session not persisting
- Check middleware configuration
- Verify cookie settings
- Check for HTTPS requirement in production

## Next Steps

After authentication is working:
1. Implement user profiles (Phase 3)
2. Add role-based access control
3. Implement email verification
4. Add two-factor authentication (optional)
5. Implement social features

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

