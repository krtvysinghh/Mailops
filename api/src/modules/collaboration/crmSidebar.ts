/**
 * Feature 30: Customer Context / Mini CRM Sidebar
 * 
 * Provides automated sender profile aggregation, interaction intelligence,
 * relationship health scoring, company domain parsing, and deal pipeline tracking.
 */

export type CRMStage = 'lead' | 'opportunity' | 'active_customer' | 'vip' | 'churned';

export interface DealItem {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';
  expectedCloseDate?: Date | null;
}

export interface ContactRecord {
  id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  stage: CRMStage;
  phone?: string | null;
  notes?: string | null;
  deals: DealItem[];
  tags: string[];
  interactionCount: number;
  lastContactedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrichedContactProfile extends ContactRecord {
  domain: string;
  inboundCount: number;
  outboundCount: number;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  healthScore: number; // 0 - 100
  recentThreads: Array<{
    id: string;
    subject: string | null;
    direction: 'inbound' | 'outbound';
    createdAt: Date;
  }>;
}

/**
 * Extracts clean company name from email domain (e.g. "alex@stripe.com" -> "Stripe").
 */
export function extractCompanyFromEmail(emailAddr: string): { domain: string; companyName: string } {
  const parts = (emailAddr || '').trim().split('@');
  if (parts.length < 2) {
    return { domain: 'unknown', companyName: 'Unknown' };
  }

  const domain = parts[1].toLowerCase();
  const root = domain.split('.')[0];
  const companyName = root.charAt(0).toUpperCase() + root.slice(1);

  return { domain, companyName };
}

/**
 * Computes a relationship health score (0 - 100) based on interaction recency,
 * interaction volume, and bidirectional balance.
 */
export function calculateRelationshipHealthScore(
  totalInteractions: number,
  lastContactedAt: Date | null,
  inboundCount: number,
  outboundCount: number,
  now: Date = new Date()
): number {
  if (totalInteractions === 0) return 0;

  // 1. Recency component (max 40 pts)
  let recencyScore = 40;
  if (lastContactedAt) {
    const daysSince = Math.max(0, (now.getTime() - lastContactedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) recencyScore = 40;
    else if (daysSince <= 30) recencyScore = 30;
    else if (daysSince <= 90) recencyScore = 20;
    else if (daysSince <= 180) recencyScore = 10;
    else recencyScore = 5;
  } else {
    recencyScore = 10;
  }

  // 2. Frequency & Volume component (max 35 pts)
  let volumeScore = Math.min(35, totalInteractions * 3.5);

  // 3. Bidirectional Balance component (max 25 pts)
  let balanceScore = 0;
  if (inboundCount > 0 && outboundCount > 0) {
    const ratio = Math.min(inboundCount, outboundCount) / Math.max(inboundCount, outboundCount);
    balanceScore = Math.round(ratio * 25);
  } else {
    balanceScore = 5; // One-sided conversation
  }

  return Math.min(100, Math.round(recencyScore + volumeScore + balanceScore));
}

/**
 * Aggregates email conversation history and existing CRM contact metadata into an enriched profile.
 */
export function aggregateContactProfile(
  emailAddr: string,
  emailHistory: Array<{
    id: string;
    fromAddr: string;
    toAddr: string;
    subject?: string | null;
    direction?: 'inbound' | 'outbound';
    createdAt: Date;
  }>,
  existingContact?: Partial<ContactRecord> | null,
  now: Date = new Date()
): EnrichedContactProfile {
  const normalizedEmail = (emailAddr || '').trim().toLowerCase();
  const { domain, companyName } = extractCompanyFromEmail(normalizedEmail);

  // Filter history relevant to this email
  const relevantEmails = emailHistory.filter(
    e => e.fromAddr.toLowerCase().includes(normalizedEmail) || e.toAddr.toLowerCase().includes(normalizedEmail)
  );

  let inboundCount = 0;
  let outboundCount = 0;
  let firstSeenAt: Date | null = null;
  let lastSeenAt: Date | null = null;

  for (const e of relevantEmails) {
    const isInbound = e.direction === 'inbound' || e.fromAddr.toLowerCase().includes(normalizedEmail);
    if (isInbound) {
      inboundCount++;
    } else {
      outboundCount++;
    }

    if (!firstSeenAt || e.createdAt.getTime() < firstSeenAt.getTime()) {
      firstSeenAt = e.createdAt;
    }
    if (!lastSeenAt || e.createdAt.getTime() > lastSeenAt.getTime()) {
      lastSeenAt = e.createdAt;
    }
  }

  const totalInteractions = relevantEmails.length;
  const healthScore = calculateRelationshipHealthScore(
    totalInteractions,
    lastSeenAt,
    inboundCount,
    outboundCount,
    now
  );

  const recentThreads = relevantEmails
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      subject: e.subject || '(No Subject)',
      direction: (e.direction || (e.fromAddr.toLowerCase().includes(normalizedEmail) ? 'inbound' : 'outbound')) as 'inbound' | 'outbound',
      createdAt: e.createdAt,
    }));

  return {
    id: existingContact?.id || `contact-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: normalizedEmail,
    name: existingContact?.name || null,
    company: existingContact?.company || companyName,
    stage: existingContact?.stage || 'lead',
    phone: existingContact?.phone || null,
    notes: existingContact?.notes || null,
    deals: existingContact?.deals || [],
    tags: existingContact?.tags || [],
    interactionCount: totalInteractions,
    lastContactedAt: lastSeenAt,
    createdAt: existingContact?.createdAt || firstSeenAt || now,
    updatedAt: existingContact?.updatedAt || now,
    domain,
    inboundCount,
    outboundCount,
    firstSeenAt,
    lastSeenAt,
    healthScore,
    recentThreads,
  };
}

/**
 * In-memory manager for CRM contacts.
 */
export class CRMContactManager {
  private contacts: Map<string, ContactRecord> = new Map(); // email -> contact

  upsertContact(email: string, updates: Partial<ContactRecord>): ContactRecord {
    const normalized = email.trim().toLowerCase();
    const existing = this.contacts.get(normalized);
    const now = new Date();

    const { companyName } = extractCompanyFromEmail(normalized);

    const contact: ContactRecord = {
      id: existing?.id || `crm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: normalized,
      name: updates.name !== undefined ? updates.name : (existing?.name || null),
      company: updates.company !== undefined ? updates.company : (existing?.company || companyName),
      stage: updates.stage || existing?.stage || 'lead',
      phone: updates.phone !== undefined ? updates.phone : (existing?.phone || null),
      notes: updates.notes !== undefined ? updates.notes : (existing?.notes || null),
      deals: updates.deals || existing?.deals || [],
      tags: updates.tags || existing?.tags || [],
      interactionCount: updates.interactionCount !== undefined ? updates.interactionCount : (existing?.interactionCount || 0),
      lastContactedAt: updates.lastContactedAt !== undefined ? updates.lastContactedAt : (existing?.lastContactedAt || null),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.contacts.set(normalized, contact);
    return contact;
  }

  getContact(email: string): ContactRecord | undefined {
    return this.contacts.get(email.trim().toLowerCase());
  }

  addDeal(email: string, deal: Omit<DealItem, 'id'>): ContactRecord {
    const contact = this.upsertContact(email, {});
    const dealItem: DealItem = {
      ...deal,
      id: `deal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    contact.deals.push(dealItem);
    contact.updatedAt = new Date();
    this.contacts.set(contact.email, contact);
    return contact;
  }

  getEnrichedProfile(email: string, emailHistory: any[]): EnrichedContactProfile {
    const contact = this.getContact(email);
    return aggregateContactProfile(email, emailHistory, contact);
  }
}
