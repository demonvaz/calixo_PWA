import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Pinned to match the account's webhook config. If you upgrade the `stripe`
  // package and TypeScript complains here, update this to the version shown
  // in the error message (it must match your Stripe Dashboard API version).
  apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
  typescript: true,
});






