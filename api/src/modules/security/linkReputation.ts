export function checkLinkReputation(url: string): number {
  let riskScore = 0;
  
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    
    const shorteners = ['bit.ly', 't.co', 'tinyurl.com'];
    if (shorteners.includes(domain)) {
      riskScore += 40;
    }
    
    const highRiskTlds = ['.zip', '.xyz', '.top'];
    if (highRiskTlds.some(tld => domain.endsWith(tld))) {
      riskScore += 30;
    }
    
    if (/[а-яА-Я]/.test(domain)) {
      riskScore += 50;
    }
    
  } catch (e) {
    riskScore = 100;
  }
  
  return Math.min(riskScore, 100);
}