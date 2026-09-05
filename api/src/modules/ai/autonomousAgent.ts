/**
 * Autonomous AI Agent for Inbox Management
 */

export interface AgentConfiguration {
  id: string;
  userId: string;
  enabled: boolean;
  preferences: {
    tone: 'professional' | 'casual' | 'friendly' | 'direct';
    autoReplyEnabled: boolean;
    requireApprovalForReplies: boolean;
    workingHoursOnly: boolean;
    timezone: string;
  };
  rules: AgentRule[];
}

export interface AgentRule {
  id: string;
  condition: {
    field: 'sender' | 'subject' | 'body' | 'intent';
    operator: 'contains' | 'equals' | 'matches' | 'is';
    value: string;
  };
  action: {
    type: 'move' | 'label' | 'archive' | 'delete' | 'forward' | 'reply' | 'markAsRead' | 'flag';
    value?: string;
  };
  priority: number;
}

export interface IncomingEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: Date;
  extractedIntent?: string;
}

export interface AgentResult {
  emailId: string;
  actionsTaken: Array<{ type: string; details?: any }>;
  generatedReply?: string;
  requiresApproval?: boolean;
}

/**
 * Configures the AI agent's rules and preferences
 */
export async function configureAgent(
  userId: string, 
  rules: AgentRule[], 
  preferences: Partial<AgentConfiguration['preferences']>
): Promise<AgentConfiguration> {
  
  const defaultPrefs: AgentConfiguration['preferences'] = {
    tone: 'professional',
    autoReplyEnabled: false,
    requireApprovalForReplies: true,
    workingHoursOnly: true,
    timezone: 'UTC'
  };

  const agent: AgentConfiguration = {
    id: `agent_${userId}`,
    userId,
    enabled: true,
    preferences: { ...defaultPrefs, ...preferences },
    // Sort rules by priority (lower number = higher priority)
    rules: [...rules].sort((a, b) => a.priority - b.priority)
  };

  // In a real system, save to DB here
  console.log(`Agent configured for user ${userId} with ${rules.length} rules.`);
  
  return agent;
}

/**
 * Main entry point for processing an incoming email through the agent
 */
export async function processIncomingEmail(
  email: IncomingEmail, 
  agent: AgentConfiguration
): Promise<AgentResult> {
  
  if (!agent.enabled) {
    return { emailId: email.id, actionsTaken: [] };
  }

  // 1. Analyze email to extract intent (mock LLM call)
  email.extractedIntent = await analyzeIntent(email.body);

  const result: AgentResult = {
    emailId: email.id,
    actionsTaken: []
  };

  // 2. Triage based on rules
  const triageActions = triageEmail(email, agent.rules);
  
  // 3. Execute actions
  for (const action of triageActions) {
    // Check if we should reply
    if (action.type === 'reply' && agent.preferences.autoReplyEnabled) {
      // Check working hours constraint
      if (agent.preferences.workingHoursOnly && !isWorkingHours(new Date(), agent.preferences.timezone)) {
        result.actionsTaken.push({ 
          type: 'delay_reply', 
          details: 'Delayed until working hours' 
        });
        continue;
      }
      
      const replyBody = await generateAutoReply(email, agent);
      result.generatedReply = replyBody;
      result.requiresApproval = agent.preferences.requireApprovalForReplies;
      
      if (!agent.preferences.requireApprovalForReplies) {
        result.actionsTaken.push({ type: 'sent_reply' });
        // Actual send logic would go here
      } else {
        result.actionsTaken.push({ type: 'drafted_reply' });
      }
    } else {
      // Execute other actions (move, label, etc)
      result.actionsTaken.push({ type: action.type, details: action.value });
      // Actual execution logic (db updates) would go here
    }
  }

  return result;
}

/**
 * Evaluates rules against an email to determine actions
 */
export function triageEmail(email: IncomingEmail, rules: AgentRule[]): AgentRule['action'][] {
  const actionsToTake: AgentRule['action'][] = [];
  const processedRuleTypes = new Set<string>(); // Prevent conflicting actions

  for (const rule of rules) {
    let matches = false;
    
    // Evaluate condition
    const { field, operator, value } = rule.condition;
    
    switch (field) {
      case 'sender':
        matches = evaluateStringMatch(email.sender, operator, value);
        break;
      case 'subject':
        matches = evaluateStringMatch(email.subject, operator, value);
        break;
      case 'body':
        matches = evaluateStringMatch(email.body, operator, value);
        break;
      case 'intent':
        matches = email.extractedIntent === value;
        break;
    }

    if (matches) {
      // Prevent conflicting actions (e.g., can't move to two different folders)
      if (rule.action.type === 'move' && processedRuleTypes.has('move')) {
        continue;
      }
      
      actionsToTake.push(rule.action);
      processedRuleTypes.add(rule.action.type);
      
      // If we hit an archive/delete, we might want to stop processing lower priority rules
      if (rule.action.type === 'delete' || rule.action.type === 'archive') {
        break;
      }
    }
  }

  return actionsToTake;
}

/**
 * Generates an automated reply based on context and agent preferences
 */
export async function generateAutoReply(
  email: IncomingEmail, 
  agent: AgentConfiguration
): Promise<string> {
  // Mock LLM generation logic
  
  let greeting = 'Hello,';
  if (agent.preferences.tone === 'casual' || agent.preferences.tone === 'friendly') {
    greeting = 'Hi there,';
  }

  let body = '';
  
  switch (email.extractedIntent) {
    case 'meeting_request':
      body = `I received your request for a meeting regarding "${email.subject}". I will review my schedule and get back to you shortly with some available times.`;
      break;
    case 'support_ticket':
      body = `Thank you for reaching out. I've received your inquiry and will look into it as soon as possible.`;
      break;
    case 'invoice_submission':
      body = `I confirm receipt of the invoice. It has been forwarded to our accounting department for processing.`;
      break;
    default:
      body = `Thank you for your email. I have received it and will respond as soon as I can.`;
  }

  let signoff = 'Best regards,\n[Agent Signature]';
  if (agent.preferences.tone === 'casual') signoff = 'Thanks,\n[Agent Signature]';
  if (agent.preferences.tone === 'friendly') signoff = 'Warmly,\n[Agent Signature]';

  return `${greeting}\n\n${body}\n\n${signoff}`;
}

// --- Internal Helpers ---

function evaluateStringMatch(target: string, operator: string, value: string): boolean {
  const t = target.toLowerCase();
  const v = value.toLowerCase();
  
  switch (operator) {
    case 'contains': return t.includes(v);
    case 'equals': return t === v;
    case 'matches': return new RegExp(v, 'i').test(t);
    case 'is': return t === v;
    default: return false;
  }
}

async function analyzeIntent(text: string): Promise<string> {
  // Mock NLP intent classification
  const lowerText = text.toLowerCase();
  if (lowerText.includes('meet') || lowerText.includes('calendar') || lowerText.includes('schedule')) {
    return 'meeting_request';
  }
  if (lowerText.includes('help') || lowerText.includes('issue') || lowerText.includes('error')) {
    return 'support_ticket';
  }
  if (lowerText.includes('invoice') || lowerText.includes('payment') || lowerText.includes('bill')) {
    return 'invoice_submission';
  }
  return 'general_inquiry';
}

function isWorkingHours(date: Date, timezone: string): boolean {
  // Simplified working hours check (Mon-Fri, 9am-5pm)
  // Real implementation would use timezone libraries
  const day = date.getDay(); // 0 = Sunday
  const hour = date.getHours();
  
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
