/**
 * Feature 47: Print & Clean PDF / EML Export View
 * Pure TypeScript RFC 822 MIME EML Generator, Blob Exporter,
 * and Browser Print trigger with zero external dependencies.
 */

export interface EmlAttachment {
  filename: string;
  contentType: string;
  base64Data?: string;
}

export interface EmlPayload {
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
  attachments?: EmlAttachment[];
}

export interface ParsedEml {
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
 * Generates an RFC 822 MIME EML document string.
 */
export function generateEml(payload: EmlPayload): string {
  const timestamp = payload.date ? new Date(payload.date) : new Date();
  const dateStr = timestamp.toUTCString();
  const messageId = payload.messageId || `<msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@mailops.local>`;

  const toList = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
  const ccList = payload.cc ? (Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc) : '';
  const bccList = payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc.join(', ') : payload.bcc) : '';

  const hasAttachments = payload.attachments && payload.attachments.length > 0;
  const hasHtml = Boolean(payload.htmlBody && payload.htmlBody.trim());
  const hasText = Boolean(payload.textBody && payload.textBody.trim());

  const boundaryMixed = `----=_Part_Mixed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const boundaryAlt = `----=_Part_Alt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const headers: string[] = [
    `Date: ${dateStr}`,
    `From: ${payload.from}`,
    `To: ${toList}`,
  ];

  if (ccList) headers.push(`Cc: ${ccList}`);
  if (bccList) headers.push(`Bcc: ${bccList}`);
  headers.push(`Subject: ${payload.subject || '(No Subject)'}`);
  headers.push(`Message-ID: ${messageId}`);
  if (payload.inReplyTo) headers.push(`In-Reply-To: ${payload.inReplyTo}`);
  if (payload.references) headers.push(`References: ${payload.references}`);
  headers.push('MIME-Version: 1.0');

  let body = '';

  if (hasAttachments) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);
    body += `--${boundaryMixed}\r\n`;

    if (hasHtml && hasText) {
      body += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\r\n\r\n`;
      body += `--${boundaryAlt}\r\n`;
      body += `Content-Type: text/plain; charset=UTF-8; format=flowed\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${payload.textBody || ''}\r\n\r\n`;
      body += `--${boundaryAlt}\r\n`;
      body += `Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${payload.htmlBody || ''}\r\n\r\n`;
      body += `--${boundaryAlt}--\r\n\r\n`;
    } else if (hasHtml) {
      body += `Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${payload.htmlBody || ''}\r\n\r\n`;
    } else {
      body += `Content-Type: text/plain; charset=UTF-8; format=flowed\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
      body += `${payload.textBody || ''}\r\n\r\n`;
    }

    for (const att of payload.attachments || []) {
      const b64 = att.base64Data || '';
      body += `--${boundaryMixed}\r\n`;
      body += `Content-Type: ${att.contentType || 'application/octet-stream'}; name="${att.filename}"\r\n`;
      body += `Content-Transfer-Encoding: base64\r\n`;
      body += `Content-Disposition: attachment; filename="${att.filename}"\r\n\r\n`;
      const lines = b64.match(/.{1,76}/g) || [b64];
      body += `${lines.join('\r\n')}\r\n\r\n`;
    }

    body += `--${boundaryMixed}--\r\n`;
  } else if (hasHtml && hasText) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/plain; charset=UTF-8; format=flowed\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
    body += `${payload.textBody || ''}\r\n\r\n`;
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`;
    body += `${payload.htmlBody || ''}\r\n\r\n`;
    body += `--${boundaryAlt}--\r\n`;
  } else if (hasHtml) {
    headers.push('Content-Type: text/html; charset=UTF-8');
    headers.push('Content-Transfer-Encoding: 8bit');
    body = `\r\n${payload.htmlBody || ''}\r\n`;
  } else {
    headers.push('Content-Type: text/plain; charset=UTF-8; format=flowed');
    headers.push('Content-Transfer-Encoding: 8bit');
    body = `\r\n${payload.textBody || ''}\r\n`;
  }

  return `${headers.join('\r\n')}\r\n\r\n${body}`;
}

/**
 * Creates a downloadable Blob from EML data.
 */
export function generateEmlBlob(payload: EmlPayload): Blob {
  const emlString = generateEml(payload);
  return new Blob([emlString], { type: 'message/rfc822' });
}

/**
 * Initiates browser file download for a generated .eml file.
 */
export function downloadEmlFile(payload: EmlPayload, customFilename?: string): void {
  const blob = generateEmlBlob(payload);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cleanSubject = (payload.subject || 'message').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = customFilename || `${cleanSubject}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw EML text into structured headers and parts.
 */
export function parseEml(emlString: string): ParsedEml {
  const normalized = emlString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const splitIdx = normalized.indexOf('\n\n');

  const rawHeaders = splitIdx !== -1 ? normalized.slice(0, splitIdx) : normalized;
  const rawBody = splitIdx !== -1 ? normalized.slice(splitIdx + 2) : '';

  const headerMap: Record<string, string> = {};
  const headerLines = rawHeaders.split('\n');

  let currentKey = '';
  for (const line of headerLines) {
    if (/^\s+/.test(line) && currentKey) {
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
  const attachments: ParsedEml['attachments'] = [];

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
 * Triggers clean native window print preview.
 */
export function printEmailElement(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
