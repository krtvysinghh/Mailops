import { Hono } from 'hono';
import { provisionEmailRoutingDNS } from '../dns';

export const dnsRouter = new Hono();

// POST /api/dns/provision
// Expects JSON: { domain: 'example.com', zoneId: '...', apiToken: '...' }
dnsRouter.post('/provision', async (c) => {
  const body = await c.req.json();
  const { domain, zoneId, apiToken } = body;

  if (!domain || !zoneId || !apiToken) {
    return c.json({ error: 'Missing required fields: domain, zoneId, apiToken' }, 400);
  }

  try {
    const results = await provisionEmailRoutingDNS({ apiToken, zoneId }, domain);
    return c.json({ success: true, results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
