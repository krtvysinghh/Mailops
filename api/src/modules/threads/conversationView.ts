export interface Message {
  id: string;
  threadId: string;
  htmlBody: string;
  inReplyTo?: string;
  references?: string[];
  from: string;
  to: string[];
  cc?: string[];
  date: Date;
}

export interface ConversationNode {
  message: Message;
  children: ConversationNode[];
}

export interface ConversationSummary {
  messageCount: number;
  participantCount: number;
  dateRange: { start: Date; end: Date };
  participants: string[];
}

export function buildConversation(messages: Message[]): ConversationNode[] {
  const nodeMap = new Map<string, ConversationNode>();
  const roots: ConversationNode[] = [];

  for (const msg of messages) {
    nodeMap.set(msg.id, { message: msg, children: [] });
  }

  for (const msg of messages) {
    const node = nodeMap.get(msg.id)!;
    
    let parentId = msg.inReplyTo;
    if (!parentId && msg.references && msg.references.length > 0) {
      parentId = msg.references[msg.references.length - 1];
    }
    
    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function collapseQuotedText(htmlBody: string): string {
  const lines = htmlBody.split('\n');
  let result = '';
  let inQuote = false;

  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      if (!inQuote) {
        result += '<div class="quoted-text-collapsed" style="display:none;">\n';
        inQuote = true;
      }
      result += line + '\n';
    } else {
      if (inQuote) {
        result += '</div>\n';
        inQuote = false;
      }
      result += line + '\n';
    }
  }

  if (inQuote) {
    result += '</div>\n';
  }

  return result;
}

export function extractInlineReplies(htmlBody: string): { newContent: string, quotedContent: string } {
  const lines = htmlBody.split('\n');
  let newContent = '';
  let quotedContent = '';

  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      quotedContent += line + '\n';
    } else {
      newContent += line + '\n';
    }
  }

  return { newContent: newContent.trim(), quotedContent: quotedContent.trim() };
}

export function getConversationParticipants(messages: Message[]): string[] {
  const participants = new Set<string>();
  
  for (const msg of messages) {
    participants.add(msg.from);
    msg.to.forEach(p => participants.add(p));
    if (msg.cc) {
      msg.cc.forEach(p => participants.add(p));
    }
  }
  
  return Array.from(participants);
}

export function getConversationSummary(messages: Message[]): ConversationSummary {
  if (messages.length === 0) {
    throw new Error("No messages in conversation");
  }

  const participants = getConversationParticipants(messages);
  
  let start = messages[0].date;
  let end = messages[0].date;

  for (const msg of messages) {
    if (msg.date < start) start = msg.date;
    if (msg.date > end) end = msg.date;
  }

  return {
    messageCount: messages.length,
    participantCount: participants.length,
    participants,
    dateRange: { start, end }
  };
}
