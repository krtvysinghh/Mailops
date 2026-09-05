export interface LoginEvent {
  userId: string;
  ip: string;
  userAgent: string;
  geo: string;
  timestamp: Date;
}
const loginHistory: Map<string, LoginEvent[]> = new Map();

export function recordLogin(userId: string, ip: string, userAgent: string, geo: string): void {
  const history = loginHistory.get(userId) || [];
  history.push({ userId, ip, userAgent, geo, timestamp: new Date() });
  loginHistory.set(userId, history);
}

export function isLoginSuspicious(userId: string, ip: string, userAgent: string): boolean {
  const history = loginHistory.get(userId) || [];
  if (history.length === 0) return false;
  
  const lastLogin = history[history.length - 1];
  const newIp = lastLogin.ip !== ip;
  const newUserAgent = lastLogin.userAgent !== userAgent;
  
  return newIp && newUserAgent;
}

export function getLoginHistory(userId: string): LoginEvent[] {
  return loginHistory.get(userId) || [];
}