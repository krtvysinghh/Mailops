/**
 * Feature 10: Smart Unsubscribe & Newsletter Parser
 * Pure TypeScript parser for RFC 2369 / RFC 8058 List-Unsubscribe headers
 * and HTML 1-click unsubscribe links. Zero external dependencies.
 */

export interface UnsubscribeResult {
  canOneClick: boolean;
  unsubscribeUrl?: string;
  mailtoTarget?: string;
  method?: 'one-click-post' | 'https' | 'mailto';
}

export function parseUnsubscribe(
  headers: Record<string, string> = {},
  htmlBody?: string
): UnsubscribeResult {
  const getHeader = (key: string): string => {
    const targetKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === targetKey) return v;
    }
    return '';
  };

  const listUnsub = getHeader('list-unsubscribe');
  const listUnsubPost = getHeader('list-unsubscribe-post');

  let httpsUrl: string | undefined;
  let mailtoUrl: string | undefined;

  // Parse List-Unsubscribe header URIs `<https://...>, <mailto:...>`
  const uriMatches = listUnsub.match(/<([^>]+)>/g);
  if (uriMatches) {
    for (const raw of uriMatches) {
      const uri = raw.slice(1, -1).trim();
      if (uri.startsWith('https://') || uri.startsWith('http://')) {
        httpsUrl = uri;
      } else if (uri.startsWith('mailto:')) {
        mailtoUrl = uri;
      }
    }
  }

  if (httpsUrl && listUnsubPost.toLowerCase().includes('one-click')) {
    return {
      canOneClick: true,
      unsubscribeUrl: httpsUrl,
      method: 'one-click-post',
    };
  }

  if (httpsUrl) {
    return {
      canOneClick: true,
      unsubscribeUrl: httpsUrl,
      method: 'https',
    };
  }

  if (mailtoUrl) {
    return {
      canOneClick: true,
      mailtoTarget: mailtoUrl,
      method: 'mailto',
    };
  }

  // Fallback: Scrape HTML body for unsubscribe / opt-out link
  if (htmlBody) {
    const linkMatch = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(?:[^<]*(?:unsubscribe|opt-out|opt out|manage subscription|email preferences|preferences)[^<]*)<\/a>/i.exec(htmlBody);
    if (linkMatch) {
      return {
        canOneClick: false,
        unsubscribeUrl: linkMatch[1],
        method: 'https',
      };
    }
  }

  return { canOneClick: false };
}
