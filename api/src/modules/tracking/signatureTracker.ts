export interface ClickMetadata {
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface LinkStats {
  linkId: string;
  originalUrl: string;
  totalClicks: number;
  uniqueClicks: number;
}

export interface SignaturePerformance {
  signatureId: string;
  totalClicks: number;
  uniqueClicks: number;
  topLinks: LinkStats[];
}

export function generateTrackingUrl(originalUrl: string, linkId: string, domainId: string): string {
  // Assuming API endpoint for tracking is configured
  return `https://api.mailops.net/track/${linkId}?domainId=${domainId}&url=${encodeURIComponent(originalUrl)}`;
}

export function createTrackedSignature(signatureHtml: string, domainId: string): string {
  let trackedHtml = signatureHtml;
  const hrefRegex = /href=["']([^"']+)["']/gi;
  
  trackedHtml = trackedHtml.replace(hrefRegex, (match, url) => {
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return match;
    }
    const linkId = crypto.randomUUID();
    const trackingUrl = generateTrackingUrl(url, linkId, domainId);
    return `href="${trackingUrl}"`;
  });
  
  return trackedHtml;
}

export async function recordClick(linkId: string, metadata: ClickMetadata, db: any): Promise<void> {
  const query = `INSERT INTO clicks (link_id, ip, user_agent, timestamp) VALUES (?, ?, ?, ?)`;
  await db.prepare(query).bind(linkId, metadata.ip, metadata.userAgent, metadata.timestamp.toISOString()).run();
}

export async function getClickStats(domainId: string, db: any, dateRange?: { start: Date, end: Date }): Promise<LinkStats[]> {
  // Mock implementation returning empty stats
  return [];
}

export async function getSignaturePerformance(signatureId: string, db: any): Promise<SignaturePerformance> {
  return {
    signatureId,
    totalClicks: 0,
    uniqueClicks: 0,
    topLinks: []
  };
}
