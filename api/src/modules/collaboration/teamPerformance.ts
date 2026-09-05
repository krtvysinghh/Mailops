export interface AgentStats {
  agentId: string;
  emailsHandled: number;
  averageResponseTimeMs: number;
  resolutionRate: number;
}

export class TeamPerformanceDashboard {
  getAgentStats(inboxId: string, history: any[], agentId: string): AgentStats {
    const agentActions = history.filter(h => h.inboxId === inboxId && h.agentId === agentId);
    
    const emailsHandled = agentActions.filter(a => a.type === 'REPLY').length;
    const resolutions = agentActions.filter(a => a.type === 'RESOLVE').length;
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    agentActions.forEach(action => {
      if (action.type === 'REPLY' && action.previousMessageAt) {
        totalResponseTime += (new Date(action.createdAt).getTime() - new Date(action.previousMessageAt).getTime());
        responseCount++;
      }
    });

    const averageResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const resolutionRate = emailsHandled > 0 ? resolutions / emailsHandled : 0;

    return {
      agentId,
      emailsHandled,
      averageResponseTimeMs,
      resolutionRate
    };
  }

  getTeamLeaderboard(inboxId: string, history: any[], agentIds: string[]): AgentStats[] {
    const stats = agentIds.map(id => this.getAgentStats(inboxId, history, id));
    
    // Sort by most emails handled, then fastest response
    return stats.sort((a, b) => {
      if (a.emailsHandled !== b.emailsHandled) {
        return b.emailsHandled - a.emailsHandled;
      }
      return a.averageResponseTimeMs - b.averageResponseTimeMs;
    });
  }
}
