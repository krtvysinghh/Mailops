/**
 * Feature 44: Custom Signature Builder & Multi-Alias
 * Pure TypeScript RFC 3676 standard signature engine,
 * template generator, delimiter injection, and signature extractor.
 */

export interface SignatureTemplate {
  id: string;
  name: string;
  description: string;
  html: (vars: SignatureVariables) => string;
  plainText: (vars: SignatureVariables) => string;
}

export interface SignatureVariables {
  fullName: string;
  title?: string;
  company?: string;
  department?: string;
  phone?: string;
  email?: string;
  website?: string;
  avatarUrl?: string;
  pronouns?: string;
  socials?: { platform: string; url: string }[];
  disclaimer?: string;
}

export const SIGNATURE_TEMPLATES: SignatureTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Clean two-line name and contact signature',
    html: (vars) => `
<div style="font-family: sans-serif; font-size: 14px; color: #333; line-height: 1.4;">
  <p style="margin: 0; font-weight: 600; color: #111;">${vars.fullName}${vars.pronouns ? ` <span style="font-weight: normal; color: #666; font-size: 12px;">(${vars.pronouns})</span>` : ''}</p>
  <p style="margin: 0; color: #666; font-size: 13px;">${[vars.title, vars.company].filter(Boolean).join(' • ')}</p>
  ${vars.email || vars.phone ? `<p style="margin: 4px 0 0 0; color: #888; font-size: 12px;">${[vars.email, vars.phone, vars.website].filter(Boolean).join(' | ')}</p>` : ''}
</div>`.trim(),
    plainText: (vars) => [
      `${vars.fullName}${vars.pronouns ? ` (${vars.pronouns})` : ''}`,
      [vars.title, vars.company].filter(Boolean).join(' • '),
      [vars.email, vars.phone, vars.website].filter(Boolean).join(' | ')
    ].filter(Boolean).join('\n'),
  },
  {
    id: 'corporate',
    name: 'Corporate Card',
    description: 'Professional layout with brand accent, logo/avatar, and contact grid',
    html: (vars) => `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 15px;">
  <tr>
    ${vars.avatarUrl ? `<td style="vertical-align: top; padding-right: 14px;"><img src="${vars.avatarUrl}" alt="${vars.fullName}" width="48" height="48" style="border-radius: 50%; display: block;" /></td>` : ''}
    <td style="vertical-align: top;">
      <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${vars.fullName}</div>
      <div style="font-size: 13px; color: #2563eb; font-weight: 500;">${[vars.title, vars.company].filter(Boolean).join(' | ')}</div>
      ${vars.phone ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">📞 ${vars.phone}</div>` : ''}
      ${vars.email ? `<div style="font-size: 12px; color: #64748b;">✉️ <a href="mailto:${vars.email}" style="color: #2563eb; text-decoration: none;">${vars.email}</a></div>` : ''}
      ${vars.website ? `<div style="font-size: 12px; color: #64748b;">🌐 <a href="${vars.website}" style="color: #2563eb; text-decoration: none;">${vars.website}</a></div>` : ''}
      ${vars.disclaimer ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 8px; font-style: italic; max-width: 450px;">${vars.disclaimer}</div>` : ''}
    </td>
  </tr>
</table>`.trim(),
    plainText: (vars) => [
      `${vars.fullName}`,
      [vars.title, vars.company].filter(Boolean).join(' | '),
      vars.phone ? `Phone: ${vars.phone}` : '',
      vars.email ? `Email: ${vars.email}` : '',
      vars.website ? `Web: ${vars.website}` : '',
      vars.disclaimer ? `\n[Disclaimer: ${vars.disclaimer}]` : ''
    ].filter(Boolean).join('\n'),
  },
  {
    id: 'technical',
    name: 'Technical / Developer',
    description: 'Monospaced developer style with branch and terminal vibes',
    html: (vars) => `
<div style="font-family: 'JetBrains Mono', Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #334155; border-left: 3px solid #10b981; padding-left: 10px; margin-top: 12px;">
  <div><strong style="color: #047857;">&gt; ${vars.fullName}</strong>${vars.pronouns ? ` <span style="color: #9ca3af;">[${vars.pronouns}]</span>` : ''}</div>
  <div style="color: #4b5563;">${[vars.title, vars.company].filter(Boolean).join(' @ ')}</div>
  ${vars.email ? `<div style="color: #6b7280;">ssh: <a href="mailto:${vars.email}" style="color: #059669;">${vars.email}</a></div>` : ''}
  ${vars.website ? `<div style="color: #6b7280;">url: <a href="${vars.website}" style="color: #059669;">${vars.website}</a></div>` : ''}
</div>`.trim(),
    plainText: (vars) => [
      `> ${vars.fullName}${vars.pronouns ? ` [${vars.pronouns}]` : ''}`,
      [vars.title, vars.company].filter(Boolean).join(' @ '),
      vars.email ? `ssh: ${vars.email}` : '',
      vars.website ? `url: ${vars.website}` : ''
    ].filter(Boolean).join('\n'),
  },
];

/**
 * RFC 3676 Standard Signature Delimiter: "-- \n" (two dashes, a space, newline).
 */
export const RFC_3676_DELIMITER = '-- \n';

/**
 * Injects a signature into an email body compliant with RFC 3676.
 * @param body Plain text or HTML body
 * @param signature Plain text or HTML signature
 * @param format 'text' | 'html'
 * @param position 'bottom' (end of email) | 'above-quote' (before reply quote)
 */
export function injectSignature(
  body: string,
  signature: string,
  format: 'text' | 'html' = 'html',
  position: 'bottom' | 'above-quote' = 'above-quote'
): string {
  if (!signature || !signature.trim()) return body;

  if (format === 'text') {
    const formattedSig = `${RFC_3676_DELIMITER}${signature.trim()}`;
    
    if (position === 'above-quote') {
      // Find quote markers (e.g., "On [Date], [User] wrote:" or "> ")
      const quoteIndex = body.search(/(?:\r?\n)(?:On .+ wrote:|-----Original Message-----|> )/);
      if (quoteIndex !== -1) {
        const preQuote = body.slice(0, quoteIndex).trimEnd();
        const postQuote = body.slice(quoteIndex);
        return `${preQuote}\n\n${formattedSig}\n${postQuote}`;
      }
    }
    return `${body.trimEnd()}\n\n${formattedSig}\n`;
  }

  // HTML format injection
  const htmlDelimiter = `<div class="mailops-signature-container" data-rfc3676="true"><div class="mailops-sig-delimiter" style="color: #94a3b8; font-size: 12px; margin: 12px 0 6px 0;">-- </div>\n${signature.trim()}\n</div>`;

  if (position === 'above-quote') {
    // Check for blockquote or gmail_quote div
    const quoteRegex = /(<blockquote\b|<div\s+class=["'][^"']*(?:gmail_quote|mailops-quote)[^"']*["'])/i;
    const match = quoteRegex.exec(body);
    if (match && match.index !== undefined) {
      const pre = body.slice(0, match.index).trimEnd();
      const post = body.slice(match.index);
      return `${pre}<br /><br />${htmlDelimiter}<br />${post}`;
    }
  }

  return `${body.trimEnd()}<br /><br />${htmlDelimiter}`;
}

/**
 * Extracts and strips the signature from an email body based on RFC 3676 delimiter.
 */
export function extractSignature(body: string, isHtml: boolean = false): {
  cleanBody: string;
  extractedSignature: string | null;
} {
  if (!body) return { cleanBody: '', extractedSignature: null };

  if (isHtml) {
    // Check for marked signature container
    const containerMatch = body.match(/<div\s+class="mailops-signature-container"[^>]*>([\s\S]*?)<\/div>/i);
    if (containerMatch) {
      const cleanBody = body.replace(containerMatch[0], '').trim();
      return {
        cleanBody,
        extractedSignature: containerMatch[1].trim(),
      };
    }
    // Check for HTML "-- " pattern
    const htmlDashMatch = body.search(/(?:<div[^>]*>|<p[^>]*>)?--\s*(?:<\/div>|<\/p>|<br\s*\/?>)/i);
    if (htmlDashMatch !== -1) {
      const cleanBody = body.slice(0, htmlDashMatch).trim();
      const extractedSignature = body.slice(htmlDashMatch).trim();
      return { cleanBody, extractedSignature };
    }
    return { cleanBody: body, extractedSignature: null };
  }

  // Plain text RFC 3676 matching: line containing exactly "-- "
  const lines = body.split(/\r?\n/);
  const delimiterIndex = lines.findIndex(line => line === '-- ' || line === '--');

  if (delimiterIndex !== -1) {
    const cleanBody = lines.slice(0, delimiterIndex).join('\n').trimEnd();
    const extractedSignature = lines.slice(delimiterIndex + 1).join('\n').trim();
    return { cleanBody, extractedSignature };
  }

  return { cleanBody: body, extractedSignature: null };
}
