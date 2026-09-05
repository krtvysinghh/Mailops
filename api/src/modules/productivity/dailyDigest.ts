export interface DigestConfig {
  domainId: string;
  scheduleHour: number;
}

export class DailyDigestCompiler {
  private configs: Map<string, DigestConfig> = new Map();

  scheduleDigest(domainId: string, hour: number): void {
    this.configs.set(domainId, { domainId, scheduleHour: hour });
  }

  compileDailyDigest(domainId: string, unreadEmails: any[]): string {
    if (unreadEmails.length === 0) {
      return '<h1>Daily Digest</h1><p>You have no unread emails. Great job!</p>';
    }

    let html = `<h1>Daily Digest</h1>`;
    html += `<p>You have ${unreadEmails.length} unread emails requiring your attention.</p>`;
    
    html += `<ul>`;
    unreadEmails.slice(0, 10).forEach(email => {
      html += `<li><strong>${email.sender}</strong>: ${email.subject}</li>`;
    });
    html += `</ul>`;

    if (unreadEmails.length > 10) {
      html += `<p>...and ${unreadEmails.length - 10} more.</p>`;
    }

    return html;
  }
}
