export interface ContactNode {
  email: string;
  domainId: string;
}

export interface InteractionEdge {
  sourceEmail: string;
  targetEmail: string;
  frequency: number;
  lastInteraction: Date;
}

export class RelationshipGraph {
  private nodes: Map<string, ContactNode> = new Map();
  private edges: Map<string, InteractionEdge> = new Map();

  constructor(private domainId: string) {}

  addNode(email: string): void {
    if (!this.nodes.has(email)) {
      this.nodes.set(email, { email, domainId: this.domainId });
    }
  }

  recordInteraction(sourceEmail: string, targetEmail: string): void {
    this.addNode(sourceEmail);
    this.addNode(targetEmail);
    
    const edgeId = `${sourceEmail}->${targetEmail}`;
    const existingEdge = this.edges.get(edgeId);
    
    if (existingEdge) {
      existingEdge.frequency += 1;
      existingEdge.lastInteraction = new Date();
    } else {
      this.edges.set(edgeId, {
        sourceEmail,
        targetEmail,
        frequency: 1,
        lastInteraction: new Date()
      });
    }
  }

  getClosestContacts(email: string, limit: number = 5): Array<{email: string, score: number}> {
    const contacts: Array<{email: string, score: number}> = [];
    
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.sourceEmail === email) {
        // Calculate score based on frequency and recency
        const daysSinceLast = (new Date().getTime() - edge.lastInteraction.getTime()) / (1000 * 3600 * 24);
        const timeDecay = Math.max(0.1, 1 - (daysSinceLast * 0.05));
        const score = edge.frequency * timeDecay;
        
        contacts.push({
          email: edge.targetEmail,
          score
        });
      }
    }
    
    return contacts.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  buildGraph(data: Array<{source: string, target: string}>): void {
    data.forEach(interaction => {
      this.recordInteraction(interaction.source, interaction.target);
    });
  }
}

export function buildGraph(domainId: string): RelationshipGraph {
  return new RelationshipGraph(domainId);
}
