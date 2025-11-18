'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import api from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function InvoicePaymentModal({ invoice, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        setLoading(true);
        const response = await api.post(`/api/client/billing/${invoice.id}/checkout`);
        
        if (response.data?.success && response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
        } else {
          throw new Error(response.data?.error || 'Failed to create checkout session');
        }
      } catch (err) {
        console.error('Error creating checkout session:', err);
        setError(err.response?.data?.error || err.message || 'Failed to create checkout session');
      } finally {
        setLoading(false);
      }
    };

    if (invoice) {
      createCheckoutSession();
    }
  }, [invoice]);

  const fetchClientSecret = async () => {
    if (!clientSecret) {
      throw new Error('Client secret not available');
    }
    return clientSecret;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">Setting up payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Pay Invoice {invoice.invoiceNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Amount:</span>
            <span className="text-2xl font-bold text-white">
              ${invoice.amount.toFixed(2)} {invoice.currency}
            </span>
          </div>
          {invoice.description && (
            <p className="text-sm text-gray-400 mt-2">{invoice.description}</p>
          )}
        </div>

        {clientSecret && (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </div>
  );
}

