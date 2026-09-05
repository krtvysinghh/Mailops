export function detectLanguage(text: string): { code: string; confidence: number } {
  // Simple heuristic for demo purposes
  // In a real app, this would use a proper trigram frequency model or n-gram analysis
  
  if (!text || text.trim().length === 0) {
    return { code: 'unknown', confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  
  const rules = [
    { code: 'es', keywords: ['hola', 'gracias', 'por favor', 'buenos dias'] },
    { code: 'fr', keywords: ['bonjour', 'merci', 's\'il vous plaît', 'oui'] },
    { code: 'de', keywords: ['hallo', 'danke', 'bitte', 'ja'] },
    { code: 'it', keywords: ['ciao', 'grazie', 'per favore', 'sì'] },
    { code: 'en', keywords: ['hello', 'thanks', 'please', 'yes'] }
  ];

  let bestMatch = 'unknown';
  let highestScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw)) {
        score++;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule.code;
    }
  }

  if (highestScore === 0) {
    // Default to English if no keywords match and it uses Latin chars
    if (/^[a-zA-Z\s.,!?]+$/.test(text)) {
      return { code: 'en', confidence: 0.3 };
    }
    return { code: 'unknown', confidence: 0 };
  }

  // Calculate a fake confidence score based on matches
  const confidence = Math.min(highestScore * 0.2 + 0.4, 0.99);
  
  return { code: bestMatch, confidence };
}
