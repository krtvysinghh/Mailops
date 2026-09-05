export function redactPII(text: string): string {
  let redacted = text;
  
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED EMAIL]');
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED PHONE]');
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED SSN]');
  redacted = redacted.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED IP]');
  
  return redacted;
}