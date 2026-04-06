import posthog from 'posthog-js';

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com',
    capture_pageview: false,   // fired manually via PageViewTracker
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

export function trackPageView() {
  posthog.capture('$pageview');
}

// Typed event catalogue — add new events here as the app grows
export const track = {
  // ── Transactions ────────────────────────────────────────
  transactionAdded: (props: { type: string; category: string; amount: number }) =>
    posthog.capture('transaction_added', props),

  transactionEdited: (props: { type: string; category: string; amount: number }) =>
    posthog.capture('transaction_edited', props),

  transactionDeleted: (props: { type: string; category: string }) =>
    posthog.capture('transaction_deleted', props),

  // ── Budgets ─────────────────────────────────────────────
  smartSetupCompleted: (props: { income: number }) =>
    posthog.capture('smart_setup_completed', props),

  budgetEdited: (props: { category: string; isAnnual: boolean; amount: number }) =>
    posthog.capture('budget_edited', props),

  budgetTabSwitched: (tab: 'monthly' | 'annual') =>
    posthog.capture('budget_tab_switched', { tab }),

  budgetCleared: () =>
    posthog.capture('budget_cleared'),

  // ── Annual Grid ─────────────────────────────────────────
  annualGridFullscreen: () =>
    posthog.capture('annual_grid_fullscreen'),

  annualGridDrilldown: (props: { category: string; month: string }) =>
    posthog.capture('annual_grid_drilldown', props),
};
