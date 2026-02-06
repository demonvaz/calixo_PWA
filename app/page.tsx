import { createClient } from '@/lib/supabase/server';
import { AuthPage } from '@/components/auth/auth-page';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si el usuario está autenticado, redirigir a /feed
  if (user) {
    const isEmailVerified = user.email_confirmed_at !== null && user.email_confirmed_at !== undefined;
    
    // Si el email no está verificado, redirigir a la página de verificación
    if (!isEmailVerified) {
      redirect(`/auth/verify-email${user.email ? `?email=${encodeURIComponent(user.email)}` : ''}`);
    }
    
    // Redirigir al feed en lugar de mostrar el feed aquí
    redirect('/feed');
  }

  // Si no está autenticado, mostrar login/signup
  return <AuthPage />;
}
