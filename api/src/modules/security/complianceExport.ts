interface AuditEvent {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
}
const auditTrail: Map<string, AuditEvent[]> = new Map();

export function generateComplianceReport(domainId: string, dateRange: { start: Date, end: Date }): any {
  const events = auditTrail.get(domainId) || [];
  const filtered = events.filter(e => e.timestamp >= dateRange.start && e.timestamp <= dateRange.end);
  
  return {
    domainId,
    reportGeneratedAt: new Date(),
    eventCount: filtered.length,
    events: filtered
  };
}

export function exportAuditTrail(domainId: string, format: 'json' | 'csv'): string {
  const events = auditTrail.get(domainId) || [];
  
  if (format === 'json') {
    return JSON.stringify(events, null, 2);
  }
  
  const csv = ['id,timestamp,action,userId'];
  for (const e of events) {
    csv.push(`${e.id},${e.timestamp.toISOString()},${e.action},${e.userId}`);
  }
  return csv.join('\n');
}