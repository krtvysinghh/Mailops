import { Context } from 'hono';

interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
}

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Automates the setup of Cloudflare Email Routing DNS records for a given domain.
 * This ensures the domain can receive emails for free via Cloudflare.
 */
export async function provisionEmailRoutingDNS(config: CloudflareConfig, domain: string) {
  const { apiToken, zoneId } = config;

  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  const records = [
    // MX Records for Cloudflare Email Routing
    { type: 'MX', name: domain, content: 'route1.mx.cloudflare.net', priority: 1, proxied: false },
    { type: 'MX', name: domain, content: 'route2.mx.cloudflare.net', priority: 2, proxied: false },
    { type: 'MX', name: domain, content: 'route3.mx.cloudflare.net', priority: 3, proxied: false },
    // SPF Record
    { type: 'TXT', name: domain, content: 'v=spf1 include:_spf.mx.cloudflare.net ~all', proxied: false },
    // DMARC Record (Best practice)
    { type: 'TXT', name: `_dmarc.${domain}`, content: 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;', proxied: false }
  ];

  const results = [];

  for (const record of records) {
    try {
      const response = await fetch(`${CF_API_BASE}/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(record),
      });

      const result = await response.json() as any;
      
      if (!response.ok) {
        if (result.errors?.[0]?.code === 81057) {
          // Record already exists
          results.push({ record, status: 'already_exists' });
        } else {
          results.push({ record, status: 'error', errors: result.errors });
        }
      } else {
        results.push({ record, status: 'created', id: result.result.id });
      }
    } catch (err: any) {
      results.push({ record, status: 'exception', message: err.message });
    }
  }

  // Enable Email Routing for the Zone
  try {
    const enableRouting = await fetch(`${CF_API_BASE}/zones/${zoneId}/email/routing/enable`, {
      method: 'POST',
      headers
    });
    
    const routingResult = await enableRouting.json() as any;
    results.push({ type: 'Email Routing Status', result: routingResult.success ? 'enabled' : 'failed' });
  } catch (err: any) {
    results.push({ type: 'Email Routing Status', result: 'exception', message: err.message });
  }

  return results;
}
