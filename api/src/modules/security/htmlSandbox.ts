export function sanitizeEmailHtml(html: string): string {
  let sanitized = html;
  
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');
  
  return sanitized;
}

export function generateSandboxedIframe(html: string): string {
  const sanitized = sanitizeEmailHtml(html);
  let encodedHtml = '';
  if (typeof btoa !== 'undefined') {
    encodedHtml = btoa(unescape(encodeURIComponent(sanitized)));
  } else {
    encodedHtml = Buffer.from(sanitized).toString('base64');
  }
  return `<iframe sandbox="allow-same-origin" srcdoc="data:text/html;base64,${encodedHtml}"></iframe>`;
}