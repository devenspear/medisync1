'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Subscription {
  plan_id: string;
  status: string;
  current_period_end: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscription');
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const redirectToCustomerPortal = async () => {
    try {
      const res = await fetch('/api/payment/portal', {
        method: 'POST',
      });
      const { url } = await res.json();
      router.push(url);
    } catch (error) {
      console.error('Error redirecting to customer portal:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Billing</h1>
      {subscription ? (
        <div>
          <p>Plan: {subscription.plan_id}</p>
          <p>Status: {subscription.status}</p>
          <p>Renews on: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
          <button
            onClick={redirectToCustomerPortal}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Subscription
          </button>
        </div>
      ) : (
        <div>
          <p>You are not subscribed to any plan.</p>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            View Plans
          </button>
        </div>
      )}
    </div>
  );
}
