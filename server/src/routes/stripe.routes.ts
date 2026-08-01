import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth';
import { stripe } from '../lib/stripe/server';
import { createServiceRoleClient } from '../lib/supabase/server';

const router = Router();

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Migrated from app/api/stripe/checkout/route.ts
// POST /api/stripe/checkout
router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { priceId, plan } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId es requerido' });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    if (userData.is_premium) {
      return res.status(400).json({ error: 'Ya tienes una subscripción activa' });
    }

    const appEnv = process.env.APP_ENV || 'PRO';

    if (appEnv === 'PRE') {
      console.log('🔧 PRE MODE: Activando premium sin Stripe');

      await supabase
        .from('users')
        .update({ is_premium: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      await supabase.from('subscriptions').insert({
        user_id: user.id,
        stripe_subscription_id: `pre_${user.id}_${Date.now()}`,
        status: 'active',
        plan: plan || 'premium',
        current_period_start: now.toISOString(),
        current_period_end: oneYearLater.toISOString(),
        cancel_at_period_end: false,
      });

      return res.json({
        sessionId: 'pre_mode_session',
        url: `${APP_URL}/subscription/success?session_id=pre_mode`,
        preMode: true,
      });
    }

    const email = user.email;
    if (!email) {
      return res.status(400).json({ error: 'Email no encontrado' });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing`,
      metadata: { userId: user.id, plan: plan || 'premium' },
      subscription_data: { metadata: { userId: user.id, plan: plan || 'premium' } },
    });

    return res.json({ sessionId: session.id, url: session.url, preMode: false });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Error al crear la sesión de pago' });
  }
});

// Migrated from app/api/stripe/portal/route.ts
// POST /api/stripe/portal
router.post('/portal', requireAuth, async (req: Request, res: Response) => {
  const supabase = req.supabase!;
  const user = req.user!;

  try {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (subError || !subscription || !subscription.stripe_subscription_id) {
      return res.status(404).json({ error: 'No se encontró subscripción activa' });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const customerId = stripeSubscription.customer as string;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/subscription`,
    });

    return res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ error: 'Error al crear sesión del portal' });
  }
});

// Migrated from app/api/stripe/webhook/route.ts
// POST /api/stripe/webhook
// IMPORTANT: this route needs the RAW request body to verify the Stripe
// signature, so it uses express.raw() instead of the global JSON parser
// (see app.ts, where this route is mounted before express.json()).
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan || 'premium';
  if (!userId) return;

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;

  const supabase = createServiceRoleClient();
  const stripeSubscription: any = await stripe.subscriptions.retrieve(subscriptionId);

  await supabase.from('users').update({ is_premium: true, updated_at: new Date().toISOString() }).eq('id', userId);

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  const payload = {
    stripe_subscription_id: subscriptionId,
    status: stripeSubscription.status,
    plan,
    current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: stripeSubscription.cancel_at_period_end ?? false,
  };

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await supabase.from('subscriptions').insert({ user_id: userId, ...payload });
  }

  console.log(`Subscription activated for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const supabase = createServiceRoleClient();

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  const isActive = ['active', 'trialing'].includes(subscription.status);

  await supabase.from('users').update({ is_premium: isActive, updated_at: new Date().toISOString() }).eq('id', userId);

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const supabase = createServiceRoleClient();

  await supabase.from('users').update({ is_premium: false, updated_at: new Date().toISOString() }).eq('id', userId);

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription canceled for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  console.log(`Payment succeeded for user ${userId}: $${(invoice.amount_paid / 100).toFixed(2)}`);
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  console.log(`Payment failed for user ${userId}`);
}

export default router;
