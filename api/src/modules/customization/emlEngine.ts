/**
 * Feature 47: Print & Clean PDF / EML Export View
 * Pure TypeScript RFC 822 / RFC 5322 MIME EML generator,
 * EML parser, and clean print stylesheet engine with zero dependencies.
 */

export interface EmlAttachmentInput {
  filename: string;
  contentType: string;
  base64Data?: string;
  binaryData?: Uint8Array;
}

export interface EmlInput {
  messageId?: string;
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  date?: Date | string;
  textBody?: string;
  htmlBody?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmlAttachmentInput[];
}

export interface ParsedEmlOutput {
  headers: Record<string, string>;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  date: string;
  messageId?: string;
  textBody: string;
  htmlBody: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
    base64Content?: string;
  }[];
}

/**
 * Converts a Uint8Array or byte buffer to base64 string using pure TypeScript without external dependencies.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;
  let i = 0;

  while (i < len) {
    const b1 = bytes[i++];
    const b2 = i < len ? bytes[i++] : NaN;
    const b3 = i < len ? bytes[i++] : NaN;

    const u24 = (b1 << 16) | (isNaN(b2) ? 0 : b2 << 8) | (isNaN(b3) ? 0 : b3);

    result += chars.charAt((u24 >> 18) & 63);
    result += chars.charAt((u24 >> 12) & 63);
    result += isNaN(b2) ? '=' : chars.charAt((u24 >> 6) & 63);
    result += isNaN(b3) ? '=' : chars.charAt(u24 & 63);
  }

  return result;
}

/**
 * Generates an RFC 822 / 5322 formatted .eml document string.
 */
export function generateEml(input: EmlInput): string {
  const timestamp = input.date ? new Date(input.date) : new Date();
  const dateStr = timestamp.toUTCString();
  const messageId = input.messageId || `<msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@mailops.local>`;

  const toList = Array.isArray(input.to) ? input.to.join(', ') : input.to;
  const ccList = input.cc ? (Array.isArray(input.cc) ? input.cc.join(', ') : input.cc) : '';
  const bccList = input.bcc ? (Array.isArray(input.bcc) ? input.bcc.join(', ') : input.bcc) : '';

  const hasAttachments = input.attachments && input.attachments.length > 0;
  const hasHtml = Boolean(input.htmlBody && input.htmlBody.trim());
  const hasText = Boolean(input.textBody && input.textBody.trim());

  const boundaryMixed = `----=_Part_Mixed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const boundaryAlt = `----=_Part_Alt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const headers: string[] = [
    `Date: ${dateStr}`,
    `From: ${input.from}`,
    `To: ${toList}`,
  ];

  if (ccList) headers.push(`Cc: ${ccList}`);
  if (bccList) headers.push(`Bcc: ${bccList}`);
  headers.push(`Subject: ${input.subject || '(No Subject)'}`);
  headers.push(`Message-ID: ${messageId}`);
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headers.push(`References: ${input.references}`);
  headers.push('MIME-Version: 1.0');

  let body = '';

  if (hasAttachments) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
    body += `--${boundaryMixed}\r\n`;

    if (hasHtml && hasText) {
      body += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\r\n\r\n`;
      body += `--${boundaryAlt}\r\n`;
      body += `Content-Type: text/plain; charset=UTF-8; format=flowed\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${input.textBody || ''}\r\n\r\n`;
      body += `--${boundaryAlt}\r\n`;
      body += `Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${input.htmlBody || ''}\r\n\r\n`;
      body += `--${boundaryAlt}--\r\n\r\n`;
    } else if (hasHtml) {
      body += `Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${input.htmlBody || ''}\r\n\r\n`;
    } else {
      body += `Content-Type: text/plain; charset=UTF-8; format=flowed\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${input.textBody || ''}\r\n\r\n`;
    }

    // Attachments
    for (const att of input.attachments || []) {
      const b64 = att.base64Data || (att.binaryData ? bytesToBase64(att.binaryData) : '');
      body += `--${boundaryMixed}\r\n`;
      body += `Content-Type: ${att.contentType || 'application/octet-stream'}; name="${att.filename}"\r\n`;
      body += `Content-Transfer-Encoding: base64\r\n`;
      body += `Content-Disposition: attachment; filename="${att.filename}"\r\n\r\n`;
      // Split base64 into 76-character lines (RFC 2045)
      const lines = b64.match(/.{1,76}/g) || [b64];
      body += `${lines.join('\r\n')}\r\n\r\n`;
    }

    body += `--${boundaryMixed}--\r\n`;
  } else if (hasHtml && hasText) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/plain; charset=UTF-8; format=flowed\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
    body += `${input.textBody || ''}\r\n\r\n`;
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
    body += `${input.htmlBody || ''}\r\n\r\n`;
    body += `--${boundaryAlt}--\r\n`;
  } else if (hasHtml) {
    headers.push('Content-Type: text/html; charset=UTF-8');
    headers.push('Content-Transfer-Encoding: 8bit');
    body = `\r\n${input.htmlBody || ''}\r\n`;
  } else {
    headers.push('Content-Type: text/plain; charset=UTF-8; format=flowed');
    headers.push('Content-Transfer-Encoding: 8bit');
    body = `\r\n${input.textBody || ''}\r\n`;
  }

  return `${headers.join('\r\n')}\r\n\r\n${body}`;
}

/**
 * Parses a raw RFC 822 / 5322 EML string.
 */
export function parseEml(emlString: string): ParsedEmlOutput {
  const normalized = emlString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const splitIdx = normalized.indexOf('\n\n');

  const rawHeaders = splitIdx !== -1 ? normalized.slice(0, splitIdx) : normalized;
  const rawBody = splitIdx !== -1 ? normalized.slice(splitIdx + 2) : '';

  const headerMap: Record<string, string> = {};
  const headerLines = rawHeaders.split('\n');

  let currentKey = '';
  for (const line of headerLines) {
    if (/^\s+/.test(line) && currentKey) {
      // Unfold header line
      headerMap[currentKey] += ' ' + line.trim();
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        currentKey = line.slice(0, colonIdx).trim().toLowerCase();
        headerMap[currentKey] = line.slice(colonIdx + 1).trim();
      }
    }
  }

  const from = headerMap['from'] || '';
  const to = (headerMap['to'] || '').split(',').map(s => s.trim()).filter(Boolean);
  const cc = (headerMap['cc'] || '').split(',').map(s => s.trim()).filter(Boolean);
  const subject = headerMap['subject'] || '(No Subject)';
  const date = headerMap['date'] || '';
  const messageId = headerMap['message-id'];

  let textBody = '';
  let htmlBody = '';
  const attachments: ParsedEmlOutput['attachments'] = [];

  const contentType = headerMap['content-type'] || 'text/plain';
  const boundaryMatch = contentType.match(/boundary="?([^";\n]+)"?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = rawBody.split(`--${boundary}`);

    for (const part of parts) {
      if (part.trim() === '--' || !part.trim()) continue;
      const partNorm = part.trimStart();
      const pSplit = partNorm.indexOf('\n\n');
      const pHeadersRaw = pSplit !== -1 ? partNorm.slice(0, pSplit) : '';
      const pBody = pSplit !== -1 ? partNorm.slice(pSplit + 2) : '';

      const pContentType = (pHeadersRaw.match(/content-type:\s*([^;\n]+)/i)?.[1] || '').toLowerCase();
      const pDisposition = pHeadersRaw.match(/content-disposition:\s*([^;\n]+)/i)?.[1]?.toLowerCase();
      const pFilename = pHeadersRaw.match(/filename="?([^";\n]+)"?/i)?.[1] || 'attachment.dat';

      if (pDisposition === 'attachment' || (pFilename && pFilename !== 'attachment.dat')) {
        attachments.push({
          filename: pFilename,
          contentType: pContentType || 'application/octet-stream',
          size: pBody.length,
          base64Content: pBody.trim(),
        });
      } else if (pContentType.includes('text/html')) {
        htmlBody = pBody.trim();
      } else if (pContentType.includes('text/plain')) {
        textBody = pBody.trim();
      } else if (pContentType.includes('multipart/alternative')) {
        // Inner nested boundary
        const innerBoundary = pHeadersRaw.match(/boundary="?([^";\n]+)"?/i)?.[1];
        if (innerBoundary) {
          const innerParts = pBody.split(`--${innerBoundary}`);
          for (const ip of innerParts) {
            if (ip.trim() === '--' || !ip.trim()) continue;
            const ipSplit = ip.trimStart().indexOf('\n\n');
            const ipHead = ipSplit !== -1 ? ip.slice(0, ipSplit) : '';
            const ipContent = ipSplit !== -1 ? ip.slice(ipSplit + 2).trim() : '';
            if (/text\/html/i.test(ipHead)) htmlBody = ipContent;
            else if (/text\/plain/i.test(ipHead)) textBody = ipContent;
          }
        }
      }
    }
  } else if (contentType.includes('text/html')) {
    htmlBody = rawBody.trim();
  } else {
    textBody = rawBody.trim();
  }

  return {
    headers: headerMap,
    from,
    to,
    cc,
    subject,
    date,
    messageId,
    textBody,
    htmlBody,
    attachments,
  };
}

/**
 * Generates print-optimized CSS rules for PDF/paper exports.
 */
export function getPrintStylesheet(): string {
  return `
@media print {
  @page {
    margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    size: auto;
  }
  
  body {
    background: #ffffff !important;
    color: #000000 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    font-size: 11pt !important;
    line-height: 1.5 !important;
  }

  /* Hide navigation, sidebars, buttons, toolbars */
  nav, header, aside, .no-print, button, .mailops-toolbar, .mailops-sidebar, .mailops-tabs {
    display: none !important;
  }

  /* Container cleanup */
  .mailops-print-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Printable header info */
  .mailops-print-header {
    border-bottom: 2px solid #333333 !important;
    padding-bottom: 12px !important;
    margin-bottom: 16px !important;
    display: block !important;
  }

  .mailops-print-header h1 {
    font-size: 16pt !important;
    margin: 0 0 8px 0 !important;
    color: #000000 !important;
  }

  .mailops-print-meta-row {
    font-size: 9.5pt !important;
    color: #333333 !important;
    margin-bottom: 4px !important;
  }

  /* Content & typography */
  .mailops-print-body {
    font-size: 10.5pt !important;
    color: #111111 !important;
  }

  /* Avoid page breaks inside message cards */
  .mailops-print-card, blockquote, pre, table {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Hyperlinks display text + href */
  a[href]:after {
    content: " (" attr(href) ")";
    font-size: 8.5pt;
    color: #555555;
  }

  /* Attachments table */
  .mailops-print-attachments {
    margin-top: 20px !important;
    border-top: 1px dashed #666666 !important;
    padding-top: 10px !important;
    font-size: 9pt !important;
  }
}
`.trim();
}
