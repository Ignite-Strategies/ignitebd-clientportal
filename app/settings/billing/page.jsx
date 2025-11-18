'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';

/**
 * Billing Page (MVP1 - Scaffold)
 * 
 * Fetches /api/invoices
 * Renders basic list of invoices
 * Shows placeholder "Pay Now" button (no Stripe yet)
 */
export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/login');
        return;
      }

      // Fetch invoices
      try {
        const invoicesResponse = await api.get('/api/client/billing');
        if (invoicesResponse.data?.success) {
          setInvoices(invoicesResponse.data.invoices || []);
        }
      } catch (error) {
        console.error('❌ Error loading invoices:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-gray-300 hover:text-white"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Ignite"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-sm font-semibold text-gray-300">Ignite</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
          <p className="text-gray-400">View and manage your invoices</p>
        </div>

        {/* Invoices List */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Invoices</h2>
          </div>
          <div className="p-6">
            {invoices.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No invoices yet</p>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-white">
                          Invoice {invoice.invoiceNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === 'paid'
                              ? 'bg-green-900 text-green-300'
                              : invoice.status === 'failed'
                                ? 'bg-red-900 text-red-300'
                                : 'bg-yellow-900 text-yellow-300'
                          }`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span>
                          Amount: <span className="text-white font-semibold">
                            ${invoice.amount.toFixed(2)} {invoice.currency}
                          </span>
                        </span>
                        {invoice.dueDate && (
                          <span>Due: {formatDate(invoice.dueDate)}</span>
                        )}
                        {invoice.trigger && (
                          <span>Trigger: {invoice.trigger}</span>
                        )}
                      </div>
                      {invoice.description && (
                        <p className="text-sm text-gray-400 mt-2">{invoice.description}</p>
                      )}
                    </div>
                    {invoice.status === 'pending' && (
                      <button
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition ml-4"
                        disabled
                        title="Payment processing coming soon"
                      >
                        Pay Now
                      </button>
                    )}
                    {invoice.status === 'paid' && invoice.paidAt && (
                      <div className="text-sm text-gray-400 ml-4">
                        Paid {formatDate(invoice.paidAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

