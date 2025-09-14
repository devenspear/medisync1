import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Database } from '@/lib/database';

// POST /api/payment/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Payment webhook not configured' },
      { status: 503 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });

  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (userId) {
          // Upgrade user to premium
          await Database.updateUser(userId, {
            subscription_tier: 'premium'
          });
          console.log(`✅ User ${userId} upgraded to premium`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          // Retrieve customer to get user ID
          const customer = await stripe.customers.retrieve(customerId);
          if ('metadata' in customer && customer.metadata.user_id) {
            await Database.updateUser(customer.metadata.user_id, {
              subscription_tier: 'premium'
            });
            console.log(`✅ User ${customer.metadata.user_id} payment succeeded`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if ('metadata' in customer && customer.metadata.user_id) {
            console.log(`❌ Payment failed for user ${customer.metadata.user_id}`);
            // Could send email notification here
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if ('metadata' in customer && customer.metadata.user_id) {
            // Downgrade user to free
            await Database.updateUser(customer.metadata.user_id, {
              subscription_tier: 'free'
            });
            console.log(`⬇️  User ${customer.metadata.user_id} downgraded to free`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}