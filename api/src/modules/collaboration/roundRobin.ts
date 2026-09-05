export interface RotationState {
  inboxId: string;
  memberIds: string[];
  currentIndex: number;
  unavailableMembers: Set<string>;
}

export class RoundRobinService {
  private rotations: Map<string, RotationState> = new Map();

  configureRotation(inboxId: string, memberIds: string[]): void {
    this.rotations.set(inboxId, {
      inboxId,
      memberIds,
      currentIndex: 0,
      unavailableMembers: new Set()
    });
  }

  skipUnavailable(inboxId: string, memberId: string, isUnavailable: boolean): void {
    const rotation = this.rotations.get(inboxId);
    if (!rotation) return;

    if (isUnavailable) {
      rotation.unavailableMembers.add(memberId);
    } else {
      rotation.unavailableMembers.delete(memberId);
    }
  }

  getNextAssignee(inboxId: string): string | null {
    const rotation = this.rotations.get(inboxId);
    if (!rotation || rotation.memberIds.length === 0) return null;

    let attempts = 0;
    const totalMembers = rotation.memberIds.length;

    while (attempts < totalMembers) {
      const candidateId = rotation.memberIds[rotation.currentIndex];
      
      // Advance pointer
      rotation.currentIndex = (rotation.currentIndex + 1) % totalMembers;
      
      if (!rotation.unavailableMembers.has(candidateId)) {
        return candidateId;
      }
      attempts++;
    }

    // Everyone is unavailable
    return null;
  }
}
