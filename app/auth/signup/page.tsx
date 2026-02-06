'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { SignupFormMultistep } from '@/components/auth/signup-form-multistep';

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupFormMultistep />
    </AuthLayout>
  );
}

