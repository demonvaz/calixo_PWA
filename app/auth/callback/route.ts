import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * OAuth callback route
 * Handles the redirect from OAuth providers (Google, etc.)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    
    // Check if email is verified
    const isEmailVerified = data.user?.email_confirmed_at !== null && data.user?.email_confirmed_at !== undefined;
    
    if (!isEmailVerified && data.user?.email) {
      // Redirect to verification page if email not verified
      return NextResponse.redirect(`${origin}/auth/verify-email?email=${encodeURIComponent(data.user.email)}`);
    }
  }

  // Redirect to home (feed) after successful auth
  return NextResponse.redirect(`${origin}/`);
}

