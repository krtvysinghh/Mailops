export interface InteractionHistory {
  emailId: string;
  sentAt: Date;
  openedAt?: Date;
  repliedAt?: Date;
}

export interface TimeSlotScore {
  hourOfDay: number;
  dayOfWeek: number;
  score: number;
}

export class SendTimePredictor {
  private history: Map<string, InteractionHistory[]> = new Map();

  recordInteraction(recipientEmail: string, interaction: InteractionHistory): void {
    const userHistory = this.history.get(recipientEmail) || [];
    userHistory.push(interaction);
    this.history.set(recipientEmail, userHistory);
  }

  predictBestSendTime(recipientEmail: string): { hour: number, day: number, confidence: number } {
    const userHistory = this.history.get(recipientEmail);
    
    if (!userHistory || userHistory.length === 0) {
      // Default to Tuesday 10 AM if no data
      return { hour: 10, day: 2, confidence: 0.1 };
    }

    const scores: TimeSlotScore[] = [];
    
    // Initialize scores
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        scores.push({ dayOfWeek: d, hourOfDay: h, score: 0 });
      }
    }

    let totalInteractions = 0;

    userHistory.forEach(interaction => {
      if (interaction.openedAt) {
        const hour = interaction.openedAt.getHours();
        const day = interaction.openedAt.getDay();
        const slot = scores.find(s => s.hourOfDay === hour && s.dayOfWeek === day);
        if (slot) slot.score += 1;
        totalInteractions++;
      }
      if (interaction.repliedAt) {
        const hour = interaction.repliedAt.getHours();
        const day = interaction.repliedAt.getDay();
        const slot = scores.find(s => s.hourOfDay === hour && s.dayOfWeek === day);
        if (slot) slot.score += 2; // Replies weighted heavier
        totalInteractions++;
      }
    });

    if (totalInteractions === 0) {
      return { hour: 10, day: 2, confidence: 0.1 };
    }

    const bestSlot = scores.reduce((best, current) => current.score > best.score ? current : best, scores[0]);
    
    return {
      hour: bestSlot.hourOfDay,
      day: bestSlot.dayOfWeek,
      confidence: Math.min(1.0, totalInteractions / 20)
    };
  }
}
