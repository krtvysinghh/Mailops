export async function validateSPF(senderIP: string, domain: string): Promise<boolean> {
  const mockDnsRecord = `v=spf1 ip4:192.168.0.0/16 include:_spf.example.com ~all`;
  
  if (mockDnsRecord.includes('~all') || mockDnsRecord.includes('-all')) {
    const included = mockDnsRecord.split(' ').find(part => part.startsWith('include:'));
    if (included) {
      const includeDomain = included.split(':')[1];
      if (includeDomain === '_spf.example.com') {
        return senderIP.startsWith('192.168.');
      }
    }
  }
  return false;
}