import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { db } from '@/db';
import { profiles, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for subscription
 * En PRE mode, activa premium directamente sin pasar por Stripe
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId, plan } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId es requerido' },
        { status: 400 }
      );
    }

    // Get user profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    // Check if user already has premium
    if (profile.isPremium) {
      return NextResponse.json(
        { error: 'Ya tienes una subscripción activa' },
        { status: 400 }
      );
    }

    // ========================================
    // PRE MODE: Activar premium directamente
    // ========================================
    const appEnv = process.env.APP_ENV || 'PRO';
    
    if (appEnv === 'PRE') {
      console.log('🔧 PRE MODE: Activando premium sin Stripe');

      // Activar premium en el perfil
      await db
        .update(profiles)
        .set({ 
          isPremium: true,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, user.id));

      // Crear registro de subscripción simulada
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      await db.insert(subscriptions).values({
        userId: user.id,
        stripeSubscriptionId: `pre_${user.id}_${Date.now()}`, // ID simulado
        status: 'active',
        plan: plan || 'premium',
        currentPeriodStart: now,
        currentPeriodEnd: oneYearLater,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });

      console.log('✅ PRE MODE: Premium activado para usuario', user.id);

      // Retornar URL de éxito directamente
      return NextResponse.json({
        sessionId: 'pre_mode_session',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/success?session_id=pre_mode`,
        preMode: true,
      });
    }

    // ========================================
    // PRO MODE: Proceso normal con Stripe
    // ========================================
    console.log('💳 PRO MODE: Creando sesión de Stripe');

    // Get user email
    const email = user.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email no encontrado' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId: user.id,
        plan: plan || 'premium',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan || 'premium',
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      preMode: false,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}


