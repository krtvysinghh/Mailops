/**
 * Module: Multi-Tenant Billing & Subscriptions (Stripe Integration)
 * 
 * Handles per-tenant subscription plans, domain usage meters,
 * seat allocations, and checkout webhook handlers.
 */

export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  priceMonthlyUSD: number;
  maxDomains: number;
  maxSeats: number;
  storageGB: number;
  features: string[];
}

export const PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Forever',
    priceMonthlyUSD: 0,
    maxDomains: 1,
    maxSeats: 1,
    storageGB: 5,
    features: ['basic_ai', 'unlimited_inbound', 'resend_smtp']
  },
  pro: {
    id: 'pro',
    name: 'Mailops Pro',
    priceMonthlyUSD: 19,
    maxDomains: 5,
    maxSeats: 5,
    storageGB: 50,
    features: ['all_ai', 'caldav_carddav', 'custom_branding', 'warmup_engine']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Organization',
    priceMonthlyUSD: 99,
    maxDomains: 50,
    maxSeats: 100,
    storageGB: 1000,
    features: ['all_ai', 'saml_sso', 'soc2_export', 'white_label', 'dedicated_ip']
  }
};

export interface TenantBillingState {
  tenantId: string;
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: number;
}

export function evaluateTenantUsage(
  state: TenantBillingState, 
  currentDomains: number, 
  currentSeats: number
): { allowed: boolean; reason?: string } {
  const plan = PLANS[state.planId] || PLANS.free;

  if (currentDomains > plan.maxDomains) {
    return { allowed: false, reason: `Domain limit reached (${currentDomains}/${plan.maxDomains}). Please upgrade plan.` };
  }
  if (currentSeats > plan.maxSeats) {
    return { allowed: false, reason: `Seat limit reached (${currentSeats}/${plan.maxSeats}). Please upgrade plan.` };
  }

  return { allowed: true };
}
