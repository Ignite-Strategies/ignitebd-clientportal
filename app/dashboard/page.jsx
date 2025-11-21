'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import api from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import DeliverableItemCard from '@/app/components/DeliverableItemCard';
import { computeDashboardCTA } from '@/lib/services/WorkPackageDashboardService';
import { mapItemStatus } from '@/lib/services/StatusMapperService';

/**
 * Dashboard = Hydration Brain (MVP1)
 * 
 * Reads:
 * - contactId from localStorage
 * - contactCompanyId from localStorage
 * 
 * Calls:
 * - GET /api/client/engagement?companyId={contactCompanyId}
 * 
 * UI Behavior:
 * - If no workPackage: "Hi Joel 👋 Your engagement is being prepared."
 * - If workPackage exists: Show title and deliverables list
 * - Link to /work/[collateralId] using first workCollateral
 */
export default function ClientPortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workPackage, setWorkPackage] = useState(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [pendingInvoices, setPendingInvoices] = useState([]);

  useEffect(() => {
    // Use onAuthStateChanged to wait for Firebase auth to initialize
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/login');
        return;
      }

          /**
           * MVP1: Dashboard Hydration (Second Hydration)
           * 1. Read contactCompanyId from localStorage (from Step 1: Welcome)
           * 2. GET /api/client/engagement (hydrates company with workPackages)
           * 3. Company object contains workPackageId
           * 4. Display work package or empty state
           */
          const hydrateEngagement = async () => {
            try {
              console.log('🔄 [Dashboard] Starting hydration...');
              
              // Read from localStorage (set in Step 1: Welcome)
              const contactId = typeof window !== 'undefined' 
                ? localStorage.getItem('clientPortalContactId')
                : null;
              const contactCompanyId = typeof window !== 'undefined' 
                ? localStorage.getItem('clientPortalContactCompanyId')
                : null;
              const storedEmail = typeof window !== 'undefined' 
                ? localStorage.getItem('clientPortalContactEmail')
                : null;
              console.log('📦 [Dashboard] localStorage values:', {
                contactId,
                contactCompanyId,
                storedEmail,
              });

              if (!contactId || !contactCompanyId) {
                console.warn('⚠️ [Dashboard] No contact session found, redirecting to welcome');
                router.replace('/welcome');
                return;
              }

              // Set contact email for greeting
              if (storedEmail) {
                setContactEmail(storedEmail);
                // Extract first name from email (simple MVP1)
                const firstName = storedEmail.split('@')[0].split('.')[0];
                setContactName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
              }

              // Get workPackageId from localStorage (single source of truth from welcome)
              const storedWorkPackageId = typeof window !== 'undefined'
                ? localStorage.getItem('clientPortalWorkPackageId')
                : null;

              if (!storedWorkPackageId) {
                console.warn('⚠️ [Dashboard] No workPackageId in localStorage');
                setLoading(false);
                return;
              }

              // Call /api/client/allitems with workPackageId from localStorage
              // NO fallback, NO guessing, NO overwriting localStorage
              console.log('🌐 [Dashboard] Calling API: /api/client/allitems?workPackageId=' + storedWorkPackageId);
              const allItemsResponse = await api.get(`/api/client/allitems?workPackageId=${storedWorkPackageId}`);
              
              console.log('✅ [Dashboard] API Response received:', {
                success: allItemsResponse.data?.success,
                hasWorkPackage: !!allItemsResponse.data?.workPackage,
                stats: allItemsResponse.data?.stats,
              });
           
              if (allItemsResponse.data?.success && allItemsResponse.data.workPackage) {
                console.log('✅ [Dashboard] Hydration successful!');
                
                const wp = allItemsResponse.data.workPackage;
                const stats = allItemsResponse.data.stats;
                const needsReviewItems = allItemsResponse.data.needsReviewItems || [];
                const allItems = allItemsResponse.data.allItems || []; // ALL items from API
                const currentPhase = allItemsResponse.data.currentPhase;
                
                // Use ALL items from API (dashboard should show all items)
                const items = allItems.length > 0 ? allItems : [...needsReviewItems, ...(currentPhase?.items || [])];
                
                const phases = currentPhase ? [currentPhase] : [];
                
                setWorkPackage({
                  ...wp,
                  stats,
                  needsReviewItems,
                  items, // ALL items (not just needs review + current phase)
                  phases,
                  _dashboardData: allItemsResponse.data,
                });
                
                console.log('✅ [Dashboard] Hydration complete - dashboard data set in state');
              } else {
                console.warn('⚠️ [Dashboard] No work package found or API error');
              }

          // Billing removed - refactoring in progress
          // TODO: Re-enable billing fetch after refactor
        } catch (error) {
          console.error('❌ [Dashboard] Hydration error:', error);
          console.error('❌ [Dashboard] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack,
          });
          // Continue - show empty state
        } finally {
          console.log('🏁 [Dashboard] Hydration flow complete, setting loading to false');
          setLoading(false);
        }
      };

      hydrateEngagement();
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl">Loading dashboard...</p>
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Client Portal</h1>
            </div>
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

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {!workPackage ? (
           // No work package - empty state
           <div className="text-center py-16">
             <h2 className="text-3xl font-bold text-white mb-4">
               {contactName || 'Welcome'} 👋
             </h2>
             <p className="text-xl text-gray-400 mb-2">
               We apologize for the issue.
             </p>
             <p className="text-lg text-gray-500">
               Someone will be in touch shortly.
             </p>
           </div>
         ) : (
           // Work package exists
           <>
             <div className="mb-8">
               <h2 className="text-3xl font-bold text-white mb-2">
                 {workPackage.company?.companyName || contactName || 'Work Package'}
               </h2>
               <p className="text-xl text-gray-400 mb-4">
                 {workPackage.title || 'Active Work Package'}
               </p>
               {workPackage.description && (
                 <p className="text-gray-500">{workPackage.description}</p>
               )}
             </div>

            {/* Invoice Notification - Temporarily disabled during refactor */}
            {false && pendingInvoices.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-yellow-600/20 to-amber-500/20 border-2 border-yellow-500/50 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-500/20 rounded-full">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Invoice Due</h3>
                    </div>
                    <p className="text-gray-300 mb-3">
                      {pendingInvoices.length === 1 
                        ? `You have ${pendingInvoices.length} payment due.`
                        : `You have ${pendingInvoices.length} payments due.`
                      }
                    </p>
                    {pendingInvoices.length === 1 && pendingInvoices[0] && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Invoice {pendingInvoices[0].invoiceNumber}</p>
                            <p className="text-xl font-bold text-white mt-1">
                              ${pendingInvoices[0].amount.toFixed(2)} {pendingInvoices[0].currency}
                            </p>
                            {pendingInvoices[0].dueDate && (
                              <p className="text-sm text-gray-400 mt-1">
                                Due: {new Date(pendingInvoices[0].dueDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/settings/billing')}
                    className="ml-4 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition shadow-lg whitespace-nowrap"
                  >
                    View Invoices
                  </button>
                </div>
              </div>
            )}

            {/* Section A - Stats */}
            {(() => {
              // Use stats from API (computed server-side) or compute if not available
              const totals = workPackage.stats || { total: 0, completed: 0, inProgress: 0, needsReview: 0, notStarted: 0 };
              
              return (
                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Deliverables</div>
                    <div className="text-2xl font-bold text-white">{totals.total}</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-400">{totals.completed}</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">In Progress</div>
                    <div className="text-2xl font-bold text-blue-400">{totals.inProgress}</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Needs Review</div>
                    <div className="text-2xl font-bold text-yellow-400">{totals.needsReview}</div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Not Started</div>
                    <div className="text-2xl font-bold text-gray-400">{totals.notStarted}</div>
                  </div>
                </div>
              );
            })()}

            {/* Section B - Big CTA Button */}
            {(() => {
              // Use stats from API or compute if not available
              const totals = workPackage.stats || { total: 0, completed: 0, inProgress: 0, needsReview: 0, notStarted: 0 };
              const cta = computeDashboardCTA(totals);
              const wpId = workPackage.id; // Use workPackage.id from API response only
              
              return (
                <div className="mb-8 text-center">
                  <button
                    onClick={() => router.push(`/client/work/${wpId}`)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
                  >
                    {cta}
                  </button>
                </div>
              );
            })()}

            {/* Section C - Consultant Priorities This Week */}
            {workPackage.prioritySummary && (
              <div className="mb-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Consultant Priorities This Week</h3>
                <p className="text-gray-300">{workPackage.prioritySummary}</p>
              </div>
            )}

            {/* Section D - Needs Your Review */}
            {(() => {
              // Use needsReviewItems from API (only those items)
              const needsReviewItems = workPackage.needsReviewItems || [];
              
              if (needsReviewItems.length === 0) {
                return null; // Hide section if no items need review
              }

              return (
                <div className="mb-8 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">Needs Your Review</h3>
                    <span className="px-2 py-1 bg-yellow-600/50 text-yellow-200 text-xs font-semibold rounded-full">
                      {needsReviewItems.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {needsReviewItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-900/50 border border-yellow-700/30 rounded-lg p-4"
                      >
                        <DeliverableItemCard item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Section E - Current Phase */}
            {(() => {
              // Use currentPhase from dashboard API (already optimized)
              const dashboardData = workPackage._dashboardData || {};
              const currentPhase = dashboardData.currentPhase || workPackage.phases?.[0];
              const currentPhaseItems = currentPhase?.items || [];

              if (!currentPhase) {
                return (
                  <div className="mb-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <p className="text-gray-400 text-center">No phases yet</p>
                  </div>
                );
              }

              // Determine current phase status from items
              const phaseStatuses = currentPhaseItems.map(
                i => mapItemStatus(i, i.workCollateral || [])
              );

              const phaseStatus =
                phaseStatuses.includes("IN_REVIEW") || phaseStatuses.includes("CHANGES_NEEDED") ? "in_review" :
                phaseStatuses.includes("IN_PROGRESS") || phaseStatuses.includes("CHANGES_IN_PROGRESS") ? "in_progress" :
                phaseStatuses.every(s => s === "APPROVED") ? "approved" :
                "not_started";

              return (
                <div className="mb-8 bg-gray-900 border border-gray-700 rounded-lg">
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">Current Phase</h3>
                      <StatusBadge status={phaseStatus} />
                    </div>
                    <div className="mt-2">
                      <h4 className="text-base font-medium text-white">{currentPhase.name}</h4>
                      {currentPhase.description && (
                        <p className="text-sm text-gray-400 mt-1">{currentPhase.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {currentPhaseItems.length > 0 ? (
                      <div className="space-y-4">
                        {currentPhaseItems.map(item => (
                          <div
                            key={item.id}
                            className="flex flex-col bg-gray-900 border border-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-medium">{item.deliverableLabel}</h4>
                              <StatusBadge status={mapItemStatus(item, item.workCollateral || [])} />
                            </div>

                            {item.deliverableDescription && (
                              <p className="text-gray-400 text-sm mt-1">
                                {item.deliverableDescription}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No deliverables in this phase</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* View Full Project Footer Button */}
            <div className="mt-12 text-center">
              <button
                onClick={() => router.push(`/client/work/${workPackage.id}`)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
              >
                View Full Project →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
