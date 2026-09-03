export interface DnsRecordStatus {
  type: string;
  expected: string;
  actual: string | null;
  status: 'green' | 'yellow' | 'red';
  fixCommand?: string;
}

export interface DomainHealthReport {
  hostname: string;
  mx: DnsRecordStatus;
  spf: DnsRecordStatus;
  dkim: DnsRecordStatus;
  dmarc: DnsRecordStatus;
  overallStatus: 'green' | 'yellow' | 'red';
  fixes: string[];
}

export async function checkMXRecords(hostname: string): Promise<DnsRecordStatus> {
  return {
    type: 'MX',
    expected: 'mx.cloudflare.net',
    actual: null,
    status: 'red',
    fixCommand: `Add MX record for ${hostname} pointing to mx.cloudflare.net`
  };
}

export async function checkSPFRecord(hostname: string): Promise<DnsRecordStatus> {
  return {
    type: 'TXT',
    expected: 'v=spf1 include:_spf.mx.cloudflare.net include:sendgrid.net ~all',
    actual: null,
    status: 'red',
    fixCommand: `Add TXT record for ${hostname} with value: v=spf1 include:_spf.mx.cloudflare.net include:sendgrid.net ~all`
  };
}

export async function checkDKIMRecord(hostname: string, selector: string): Promise<DnsRecordStatus> {
  return {
    type: 'TXT',
    expected: 'v=DKIM1; k=rsa; p=...',
    actual: null,
    status: 'red',
    fixCommand: `Add TXT record for ${selector}._domainkey.${hostname} with your DKIM public key`
  };
}

export async function checkDMARCRecord(hostname: string): Promise<DnsRecordStatus> {
  return {
    type: 'TXT',
    expected: 'v=DMARC1; p=none; rua=mailto:postmaster@' + hostname,
    actual: null,
    status: 'red',
    fixCommand: `Add TXT record for _dmarc.${hostname} with value: v=DMARC1; p=none; rua=mailto:postmaster@${hostname}`
  };
}

export async function getFullDomainHealth(hostname: string, dkimSelector: string = 'default'): Promise<DomainHealthReport> {
  const mx = await checkMXRecords(hostname);
  const spf = await checkSPFRecord(hostname);
  const dkim = await checkDKIMRecord(hostname, dkimSelector);
  const dmarc = await checkDMARCRecord(hostname);

  const statuses = [mx.status, spf.status, dkim.status, dmarc.status];
  let overallStatus: 'green' | 'yellow' | 'red' = 'green';
  
  if (statuses.includes('red')) {
    overallStatus = 'red';
  } else if (statuses.includes('yellow')) {
    overallStatus = 'yellow';
  }

  return {
    hostname,
    mx,
    spf,
    dkim,
    dmarc,
    overallStatus,
    fixes: suggestFixes({ hostname, mx, spf, dkim, dmarc, overallStatus, fixes: [] })
  };
}

export function suggestFixes(report: DomainHealthReport): string[] {
  const fixes: string[] = [];
  if (report.mx.status !== 'green' && report.mx.fixCommand) fixes.push(report.mx.fixCommand);
  if (report.spf.status !== 'green' && report.spf.fixCommand) fixes.push(report.spf.fixCommand);
  if (report.dkim.status !== 'green' && report.dkim.fixCommand) fixes.push(report.dkim.fixCommand);
  if (report.dmarc.status !== 'green' && report.dmarc.fixCommand) fixes.push(report.dmarc.fixCommand);
  return fixes;
}
