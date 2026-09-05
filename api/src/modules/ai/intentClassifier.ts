export type Intent = 'request' | 'inform' | 'confirm' | 'reject' | 'question' | 'unknown';

export function classifyIntent(text: string): Intent {
  const lower = text.toLowerCase();
  
  if (lower.includes('?') || lower.startsWith('how') || lower.startsWith('what') || lower.startsWith('when')) {
    return 'question';
  }
  
  if (lower.includes('please send') || lower.includes('could you') || lower.includes('i need')) {
    return 'request';
  }
  
  if (lower.includes('confirmed') || lower.includes('looks good') || lower.includes('i agree')) {
    return 'confirm';
  }
  
  if (lower.includes('cannot') || lower.includes('unfortunately') || lower.includes('reject')) {
    return 'reject';
  }
  
  if (lower.includes('fyi') || lower.includes('just to let you know') || lower.includes('update on')) {
    return 'inform';
  }
  
  return 'unknown';
}
