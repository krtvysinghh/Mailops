export interface FollowUpReminder {
  emailId: string;
  domainId: string;
  dueDate: Date;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

export class FollowUpTracker {
  private reminders: Map<string, FollowUpReminder> = new Map();

  setFollowUp(emailId: string, domainId: string, days: number): FollowUpReminder {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    
    const reminder: FollowUpReminder = {
      emailId,
      domainId,
      dueDate,
      status: 'PENDING'
    };
    
    this.reminders.set(emailId, reminder);
    return reminder;
  }

  getOverdueFollowUps(domainId: string): FollowUpReminder[] {
    const now = new Date();
    return Array.from(this.reminders.values())
      .filter(r => r.domainId === domainId && r.status === 'PENDING' && r.dueDate <= now);
  }

  clearFollowUp(emailId: string): void {
    const reminder = this.reminders.get(emailId);
    if (reminder) {
      reminder.status = 'COMPLETED';
    }
  }
  
  cancelFollowUp(emailId: string): void {
    const reminder = this.reminders.get(emailId);
    if (reminder) {
      reminder.status = 'CANCELLED';
    }
  }
}
