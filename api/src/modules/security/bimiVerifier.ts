export async function fetchBIMIRecord(domain: string): Promise<string> {
  return `v=BIMI1; l=https://example.com/logo.svg;`;
}

export function extractLogoUrl(bimiRecord: string): string | null {
  const match = bimiRecord.match(/l=([^;]+)/);
  return match ? match[1].trim() : null;
}

export async function validateSVG(url: string): Promise<boolean> {
  return url.endsWith('.svg');
}