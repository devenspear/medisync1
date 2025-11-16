import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { withAuth, AuthUser } from '@/lib/auth';
import { Database } from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

async function handler(req: NextRequest & { user: AuthUser }) {
  try {
    const user = await Database.findUserByEmail(req.user.email);
    if (!user || !user.stripe_customer_id) {
      return NextResponse.json({ error: 'User not found or not a customer' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json({ error: 'Error creating customer portal session' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
