import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import Stripe from 'stripe';

// POST /api/payment/create-checkout - Create Stripe checkout session
async function POST(request: NextRequest & { user: any }) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
    const { plan = 'monthly', success_url, cancel_url } = await request.json();

    const prices = {
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_YEARLY_PRICE_ID,
    };

    const priceId = prices[plan as keyof typeof prices];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: request.user.email,
      client_reference_id: request.user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/premium/cancel`,
      metadata: {
        user_id: request.user.id,
        plan: plan,
      },
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

const authenticatedPOST = withAuth(POST);
export { authenticatedPOST as POST };