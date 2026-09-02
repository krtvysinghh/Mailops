/**
 * Feature 5: Action Item & Task Extractor
 * Pure TypeScript modal verb grammar matcher and markdown checklist parser
 * for commitments, tasks, assignees, and due dates. Zero external dependencies.
 */

export interface ExtractedTask {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
  confidence: number;
}

export function extractTasks(body: string, emailIdPrefix?: string): ExtractedTask[] {
  if (!body || !body.trim()) return [];

  const tasks: ExtractedTask[] = [];
  const lines = body.split(/\r?\n/);
  let counter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Check checklist syntax `- [ ] Task` or `* [x] Task`
    const checklistMatch = /^[-*]\s*\[([ xX])\]\s*(.+)$/.exec(trimmed);
    if (checklistMatch) {
      const isDone = checklistMatch[1].toLowerCase() === 'x';
      const rawText = checklistMatch[2].trim();

      // Check if due date is mentioned in checklist
      const dueMatch = /(?:by|due:?)\s+([A-Za-z0-9\s/:-]+)$/i.exec(rawText);
      const cleanTaskText = dueMatch ? rawText.slice(0, dueMatch.index).trim() : rawText;

      const id = emailIdPrefix ? `task-${emailIdPrefix}-${counter++}` : `task-${counter++}`;
      tasks.push({
        id,
        text: cleanTaskText || rawText,
        dueDate: dueMatch ? dueMatch[1].trim() : undefined,
        completed: isDone,
        confidence: 0.95,
      });
      continue;
    }

    // 2. Check commitment and request patterns
    const commitmentPatterns: { regex: RegExp; type: 'assignee' | 'self' | 'request' | 'modal' | 'label' }[] = [
      { regex: /^([A-Z][a-z]+),\s+please\s+([a-z0-9\s-]+?)(?:\s+by\s+([a-z0-9\s/:-]+))?[.!?]?$/i, type: 'assignee' },
      { regex: /^(?:I|we)\s+will\s+([a-z0-9\s-]+?)(?:\s+by\s+([a-z0-9\s/:-]+))?[.!?]?$/i, type: 'self' },
      { regex: /^(?:Please|kindly)\s+([a-z0-9\s-]+?)(?:\s+by\s+([a-z0-9\s/:-]+))?[.!?]?$/i, type: 'request' },
      { regex: /^(?:Can|Could)\s+you\s+([a-z0-9\s-]+?)(?:\s+by\s+([a-z0-9\s/:-]+))?[.!?]?$/i, type: 'modal' },
      { regex: /^(?:Action item|TODO|Task):\s*(.+)$/i, type: 'label' }
    ];

    for (const { regex, type } of commitmentPatterns) {
      const match = regex.exec(trimmed);
      if (match) {
        let taskText = '';
        let assignee: string | undefined;
        let dueDate: string | undefined;

        if (type === 'assignee') {
          assignee = match[1];
          taskText = match[2];
          dueDate = match[3];
        } else if (type === 'label') {
          taskText = match[1];
        } else {
          taskText = match[1];
          dueDate = match[2];
        }

        if (taskText && taskText.trim()) {
          const id = emailIdPrefix ? `task-${emailIdPrefix}-${counter++}` : `task-${counter++}`;
          tasks.push({
            id,
            text: taskText.trim(),
            assignee: assignee?.trim(),
            dueDate: dueDate?.trim(),
            completed: false,
            confidence: 0.85,
          });
          break;
        }
      }
    }
  }

  return tasks;
}
