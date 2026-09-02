/**
 * Feature 36: Tracking Pixel & Spy Link Blocker (Privacy Shield)
 * 
 * HTML DOM Sanitization & Tracking URL Neutralizer:
 * 1. Strips 1x1 pixel tracking images and hidden web bugs.
 * 2. Matches and eliminates known spy pixel endpoints (HubSpot, Superhuman, Streak, Mailgun, SendGrid, etc.).
 * 3. Strips prefetch web bugs and hidden background-image triggers.
 * 
 * Zero new NPM dependencies. Pure TypeScript.
 */

export interface BlockedTracker {
  type: 'pixel' | 'known_tracker_domain' | 'prefetch_bug' | 'hidden_style';
  url: string;
  reason: string;
}

export interface TrackerBlockerResult {
  cleanHtml: string;
  strippedCount: number;
  blockedTrackers: BlockedTracker[];
  hasTrackers: boolean;
  privacyShieldSummary: string;
}

// Known email spy trackers and CRM pixel services
const KNOWN_TRACKER_PATTERNS: Array<{ regex: RegExp; name: string }> = [
  { regex: /mailfoogae\.appspot\.com/i, name: 'Streak CRM Email Tracker' },
  { regex: /t\.sidekickopen\.com|t\.yesware\.com/i, name: 'HubSpot / Yesware Open Tracker' },
  { regex: /mandrillapp\.com\/track/i, name: 'Mandrill Open Tracker' },
  { regex: /pixel\.wp\.com/i, name: 'WordPress Jetpack Pixel' },
  { regex: /open\.hsforms\.com/i, name: 'HubSpot Forms Tracker' },
  { regex: /superhuman\.com\/open/i, name: 'Superhuman Read Receipt Pixel' },
  { regex: /sendgrid\.net\/wf\/open/i, name: 'SendGrid Open Tracking' },
  { regex: /mailgun\.org\/tag\/|email\.mg\./i, name: 'Mailgun Open Tracking' },
  { regex: /list-manage\.com\/track\/open/i, name: 'Mailchimp Open Tracker' },
  { regex: /trk\.[a-z0-9-]+\.(com|net|io|org)\/open/i, name: 'Generic Email Open Tracker' },
  { regex: /[?&](utm_source|open_tracking|track_open|read_receipt)=/i, name: 'Spy Query Parameter' },
  { regex: /\/(pixel|beacon|spacer|blank)\.(gif|png|jpg)(\?.*)?$/i, name: '1x1 Web Bug Image File' },
];

/**
 * Checks whether an img tag or src URL represents a tracking pixel.
 */
export function isTrackingPixel(imgTagHtml: string, srcUrl: string): { isTracker: boolean; reason?: string; type: BlockedTracker['type'] } {
  const lowerTag = imgTagHtml.toLowerCase();
  const lowerSrc = srcUrl.toLowerCase();

  // 1. Dimension Check: 0x0 or 1x1 or 1x0 or 0x1 in attributes
  const widthAttr = /width=["']?(\d+)["']?/i.exec(imgTagHtml);
  const heightAttr = /height=["']?(\d+)["']?/i.exec(imgTagHtml);

  if (widthAttr && heightAttr) {
    const w = parseInt(widthAttr[1], 10);
    const h = parseInt(heightAttr[1], 10);
    if (w <= 1 && h <= 1) {
      return { isTracker: true, reason: `1x1 or 0x0 zero-pixel dimensions (width=${w}, height=${h})`, type: 'pixel' };
    }
  }

  // 2. CSS Style Check: hidden, opacity 0, or 1px dimensions
  if (/style=["'][^"']*(display:\s*none|visibility:\s*hidden|opacity:\s*0|width:\s*[01]px|height:\s*[01]px)/i.test(lowerTag)) {
    return { isTracker: true, reason: 'Hidden via inline CSS styles (display:none, visibility:hidden, or 1px)', type: 'hidden_style' };
  }

  // 3. Known Tracker URL patterns
  for (const tracker of KNOWN_TRACKER_PATTERNS) {
    if (tracker.regex.test(lowerSrc)) {
      return { isTracker: true, reason: `Matches ${tracker.name}`, type: 'known_tracker_domain' };
    }
  }

  return { isTracker: false, type: 'pixel' };
}

/**
 * Strips tracking pixels, web bugs, and spying URLs from an HTML email body.
 */
export function stripTrackersFromHtml(html: string): TrackerBlockerResult {
  if (!html) {
    return {
      cleanHtml: '',
      strippedCount: 0,
      blockedTrackers: [],
      hasTrackers: false,
      privacyShieldSummary: 'No HTML content to analyze',
    };
  }

  const blockedTrackers: BlockedTracker[] = [];
  let cleanHtml = html;

  // 1. Strip <link rel="prefetch" ...> and <link rel="prerender" ...>
  const linkBugRegex = /<link\s+[^>]*?rel=["'](prefetch|prerender|dns-prefetch)["'][^>]*>/gi;
  cleanHtml = cleanHtml.replace(linkBugRegex, (match) => {
    const hrefMatch = /href=["']([^"']+)["']/i.exec(match);
    const url = hrefMatch ? hrefMatch[1] : 'unknown';
    blockedTrackers.push({
      type: 'prefetch_bug',
      url,
      reason: 'Prefetch background link eliminated',
    });
    return `<!-- [Privacy Shield: Prefetch web bug blocked] -->`;
  });

  // 2. Scan and strip <img> tags that are tracking pixels
  const imgRegex = /<img\s+[^>]*?>/gi;
  cleanHtml = cleanHtml.replace(imgRegex, (match) => {
    const srcMatch = /src=["']([^"']+)["']/i.exec(match);
    const src = srcMatch ? srcMatch[1] : '';

    if (!src) return match;

    const check = isTrackingPixel(match, src);
    if (check.isTracker) {
      blockedTrackers.push({
        type: check.type,
        url: src,
        reason: check.reason || 'Tracking pixel detected',
      });
      return `<!-- [Privacy Shield: Blocked tracking pixel (${check.reason})] -->`;
    }

    return match;
  });

  // 3. Neutralize CSS background-image trackers
  const bgTrackerRegex = /url\(["']?([^"')]+)["']?\)/gi;
  cleanHtml = cleanHtml.replace(bgTrackerRegex, (match, url) => {
    for (const tracker of KNOWN_TRACKER_PATTERNS) {
      if (tracker.regex.test(url)) {
        blockedTrackers.push({
          type: 'known_tracker_domain',
          url,
          reason: `CSS background tracking bug (${tracker.name})`,
        });
        return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>")`;
      }
    }
    return match;
  });

  const count = blockedTrackers.length;
  const privacyShieldSummary = count === 0
    ? 'Clean email — No tracking pixels or web bugs found.'
    : `🛡️ ${count} tracking pixel${count > 1 ? 's' : ''} blocked. The sender cannot see when or how many times you opened this email.`;

  return {
    cleanHtml,
    strippedCount: count,
    blockedTrackers,
    hasTrackers: count > 0,
    privacyShieldSummary,
  };
}

export const stripTrackingPixels = stripTrackersFromHtml;

