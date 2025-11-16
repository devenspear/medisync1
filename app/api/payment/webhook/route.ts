import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Database } from '@/lib/database';

// Lazy-load Stripe to avoid build-time initialization errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function POST(req: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook not configured' },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const buf = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    // On error, log and return the error message.
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  // Successfully constructed event.
  console.log('✅ Success:', event.id);

  // TODO: Fix Stripe webhook types for new API version  // Cast event data to Stripe object.
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as any; // TODO: Fix Stripe types
    await Database.createSubscription(
      subscription.id,
      subscription.customer as string,
      subscription.items.data[0].plan.id,
      subscription.status,
      new Date((subscription.current_period_end || subscription.currentPeriodEnd) * 1000)
    );
  } else if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as any; // TODO: Fix Stripe types
    await Database.updateSubscription(
      subscription.id,
      subscription.status,
      new Date((subscription.current_period_end || subscription.currentPeriodEnd) * 1000)
    );
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any; // TODO: Fix Stripe types
    await Database.deleteSubscription(subscription.id);
  } else {
    console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
