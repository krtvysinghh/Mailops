/**
 * Feature 14: Automation Rules & Filter Engine
 * Pure TypeScript AST Evaluator for Trigger-Condition-Action workflow automation
 * across email headers, subjects, bodies, scores, and metadata with ZERO external dependencies.
 */

export type RuleTrigger = 'on_inbound' | 'on_outbound' | 'manual' | 'all';

export type ConditionOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in_list'
  | 'not_in_list';

export interface FieldPredicateNode {
  type: 'predicate';
  field: string; // e.g. 'from', 'to', 'subject', 'body', 'header:List-Unsubscribe', 'priorityScore', etc.
  operator: ConditionOperator;
  value?: string | number | boolean | string[];
  caseSensitive?: boolean;
}

export interface LogicalNode {
  type: 'logical';
  operator: 'AND' | 'OR' | 'NOT';
  children: ConditionNode[];
}

export type ConditionNode = FieldPredicateNode | LogicalNode;

export type ActionType =
  | 'star'
  | 'unstar'
  | 'mark_read'
  | 'mark_unread'
  | 'archive'
  | 'trash'
  | 'apply_label'
  | 'remove_label'
  | 'move_folder'
  | 'forward_to'
  | 'auto_reply'
  | 'set_category'
  | 'stop_processing';

export interface RuleAction {
  type: ActionType;
  value?: string | number | boolean;
  metadata?: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  domainId?: string;
  trigger: RuleTrigger;
  condition: ConditionNode;
  actions: RuleAction[];
  isActive: boolean;
  orderPriority: number; // Lowest number runs first
  createdAt?: number;
}

export interface EmailEvaluationContext {
  id?: string;
  fromAddr: string;
  toAddr: string;
  ccAddr?: string;
  bccAddr?: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, string | string[]>;
  hasAttachments?: boolean;
  priorityScore?: number;
  spamScore?: number;
  isSpam?: boolean;
  isUrgent?: boolean;
  category?: string;
  folderId?: string;
  starred?: boolean;
  read?: boolean;
  archived?: boolean;
  labels?: string[];
  [key: string]: unknown;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  appliedActions: RuleAction[];
  stopped: boolean;
}

export interface RuleSetEvaluationResult {
  matchedRules: RuleEvaluationResult[];
  accumulatedActions: RuleAction[];
  finalEmailState: Partial<EmailEvaluationContext>;
  forwardRecipients: string[];
  autoReplies: { templateOrText: string }[];
  stoppedEarly: boolean;
}

/**
 * Extracts a target field value from an email context.
 */
export function extractFieldValue(field: string, email: EmailEvaluationContext): unknown {
  if (field.startsWith('header:')) {
    const headerKey = field.substring(7).toLowerCase();
    if (!email.headers) return undefined;
    for (const [k, v] of Object.entries(email.headers)) {
      if (k.toLowerCase() === headerKey) {
        return Array.isArray(v) ? v.join(', ') : v;
      }
    }
    return undefined;
  }

  switch (field) {
    case 'from':
    case 'fromAddr':
      return email.fromAddr || '';
    case 'to':
    case 'toAddr':
      return email.toAddr || '';
    case 'cc':
    case 'ccAddr':
      return email.ccAddr || '';
    case 'bcc':
    case 'bccAddr':
      return email.bccAddr || '';
    case 'subject':
      return email.subject || '';
    case 'body':
    case 'textBody':
      return email.textBody || email.htmlBody || '';
    case 'htmlBody':
      return email.htmlBody || '';
    case 'hasAttachments':
      return !!email.hasAttachments;
    case 'priorityScore':
      return email.priorityScore ?? 0;
    case 'spamScore':
      return email.spamScore ?? 0;
    case 'isSpam':
      return !!email.isSpam;
    case 'isUrgent':
      return !!email.isUrgent;
    case 'category':
      return email.category || 'primary';
    case 'folder':
    case 'folderId':
      return email.folderId || 'inbox';
    default:
      return email[field];
  }
}

/**
 * Evaluates a single field predicate against extracted field value.
 */
export function evaluatePredicate(predicate: FieldPredicateNode, email: EmailEvaluationContext): boolean {
  const rawValue = extractFieldValue(predicate.field, email);
  const targetVal = predicate.value;
  const caseSensitive = !!predicate.caseSensitive;

  // Nil check operations
  if (predicate.operator === 'is_empty') {
    if (rawValue === undefined || rawValue === null) return true;
    if (typeof rawValue === 'string') return rawValue.trim().length === 0;
    if (Array.isArray(rawValue)) return rawValue.length === 0;
    return false;
  }

  if (predicate.operator === 'is_not_empty') {
    if (rawValue === undefined || rawValue === null) return false;
    if (typeof rawValue === 'string') return rawValue.trim().length > 0;
    if (Array.isArray(rawValue)) return rawValue.length > 0;
    return true;
  }

  // String comparison operations
  const strRaw = rawValue !== undefined && rawValue !== null ? String(rawValue) : '';
  const strTarget = targetVal !== undefined && targetVal !== null ? String(targetVal) : '';

  const aStr = caseSensitive ? strRaw : strRaw.toLowerCase();
  const bStr = caseSensitive ? strTarget : strTarget.toLowerCase();

  switch (predicate.operator) {
    case 'contains':
      return aStr.includes(bStr);

    case 'not_contains':
      return !aStr.includes(bStr);

    case 'equals':
      if (typeof targetVal === 'number' && typeof rawValue === 'number') {
        return rawValue === targetVal;
      }
      if (typeof targetVal === 'boolean') {
        return Boolean(rawValue) === targetVal;
      }
      return aStr === bStr;

    case 'not_equals':
      if (typeof targetVal === 'number' && typeof rawValue === 'number') {
        return rawValue !== targetVal;
      }
      if (typeof targetVal === 'boolean') {
        return Boolean(rawValue) !== targetVal;
      }
      return aStr !== bStr;

    case 'starts_with':
      return aStr.startsWith(bStr);

    case 'ends_with':
      return aStr.endsWith(bStr);

    case 'matches_regex':
      try {
        const regex = new RegExp(strTarget, caseSensitive ? '' : 'i');
        return regex.test(strRaw);
      } catch {
        return false;
      }

    case 'greater_than':
      return Number(rawValue) > Number(targetVal);

    case 'less_than':
      return Number(rawValue) < Number(targetVal);

    case 'greater_than_or_equal':
      return Number(rawValue) >= Number(targetVal);

    case 'less_than_or_equal':
      return Number(rawValue) <= Number(targetVal);

    case 'in_list': {
      const list = Array.isArray(targetVal)
        ? targetVal
        : strTarget.split(',').map((s) => s.trim());
      return list.some((item) => (caseSensitive ? item === strRaw : item.toLowerCase() === strRaw.toLowerCase()));
    }

    case 'not_in_list': {
      const list = Array.isArray(targetVal)
        ? targetVal
        : strTarget.split(',').map((s) => s.trim());
      return !list.some((item) => (caseSensitive ? item === strRaw : item.toLowerCase() === strRaw.toLowerCase()));
    }

    default:
      return false;
  }
}

/**
 * Recursively evaluates a ConditionNode AST against an email.
 */
export function evaluateConditionNode(node: ConditionNode, email: EmailEvaluationContext): boolean {
  if (!node) return true;

  if (node.type === 'predicate') {
    return evaluatePredicate(node, email);
  }

  if (node.type === 'logical') {
    const children = node.children || [];
    if (children.length === 0) return true;

    if (node.operator === 'AND') {
      return children.every((child) => evaluateConditionNode(child, email));
    }

    if (node.operator === 'OR') {
      return children.some((child) => evaluateConditionNode(child, email));
    }

    if (node.operator === 'NOT') {
      // NOT applies to the first child or conjunction of children
      return !children.some((child) => evaluateConditionNode(child, email));
    }
  }

  return false;
}

/**
 * Evaluates a single AutomationRule.
 */
export function evaluateRule(rule: AutomationRule, email: EmailEvaluationContext): RuleEvaluationResult {
  if (!rule.isActive) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      appliedActions: [],
      stopped: false,
    };
  }

  const matched = evaluateConditionNode(rule.condition, email);
  if (!matched) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      appliedActions: [],
      stopped: false,
    };
  }

  const stopped = rule.actions.some((a) => a.type === 'stop_processing');
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    matched: true,
    appliedActions: [...rule.actions],
    stopped,
  };
}

/**
 * Evaluates an ordered list of AutomationRules against an email and computes state transformations.
 */
export function evaluateRuleSet(
  rules: AutomationRule[],
  email: EmailEvaluationContext,
  triggerFilter: RuleTrigger = 'all'
): RuleSetEvaluationResult {
  const sorted = [...rules]
    .filter((r) => r.isActive && (triggerFilter === 'all' || r.trigger === 'all' || r.trigger === triggerFilter))
    .sort((a, b) => a.orderPriority - b.orderPriority);

  const matchedRules: RuleEvaluationResult[] = [];
  const accumulatedActions: RuleAction[] = [];
  const finalState: Partial<EmailEvaluationContext> = { ...email };
  const forwardRecipients: string[] = [];
  const autoReplies: { templateOrText: string }[] = [];
  let stoppedEarly = false;

  for (const rule of sorted) {
    const evalResult = evaluateRule(rule, finalState as EmailEvaluationContext);
    if (evalResult.matched) {
      matchedRules.push(evalResult);

      for (const action of evalResult.appliedActions) {
        accumulatedActions.push(action);

        switch (action.type) {
          case 'star':
            finalState.starred = true;
            break;
          case 'unstar':
            finalState.starred = false;
            break;
          case 'mark_read':
            finalState.read = true;
            break;
          case 'mark_unread':
            finalState.read = false;
            break;
          case 'archive':
            finalState.archived = true;
            finalState.folderId = 'archive';
            break;
          case 'trash':
            finalState.folderId = 'trash';
            break;
          case 'move_folder':
            if (action.value) finalState.folderId = String(action.value);
            break;
          case 'set_category':
            if (action.value) finalState.category = String(action.value);
            break;
          case 'apply_label':
            if (action.value) {
              const lbl = String(action.value);
              const cur = finalState.labels || [];
              if (!cur.includes(lbl)) {
                finalState.labels = [...cur, lbl];
              }
            }
            break;
          case 'remove_label':
            if (action.value && finalState.labels) {
              const lbl = String(action.value);
              finalState.labels = finalState.labels.filter((l) => l !== lbl);
            }
            break;
          case 'forward_to':
            if (action.value) {
              forwardRecipients.push(String(action.value));
            }
            break;
          case 'auto_reply':
            if (action.value) {
              autoReplies.push({ templateOrText: String(action.value) });
            }
            break;
          case 'stop_processing':
            stoppedEarly = true;
            break;
        }
      }

      if (evalResult.stopped || stoppedEarly) {
        stoppedEarly = true;
        break;
      }
    }
  }

  return {
    matchedRules,
    accumulatedActions,
    finalEmailState: finalState,
    forwardRecipients,
    autoReplies,
    stoppedEarly,
  };
}

/**
 * Validates an AutomationRule structure.
 */
export function validateRule(rule: AutomationRule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push('Rule name is required');
  }

  if (!rule.condition) {
    errors.push('Rule condition AST is required');
  } else {
    validateNode(rule.condition, errors);
  }

  if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
    errors.push('Rule must specify at least one action');
  }

  return { valid: errors.length === 0, errors };
}

function validateNode(node: ConditionNode, errors: string[]): void {
  if (!node.type) {
    errors.push('Node missing type');
    return;
  }

  if (node.type === 'predicate') {
    if (!node.field) errors.push('Predicate node missing field');
    if (!node.operator) errors.push('Predicate node missing operator');
    if (node.operator === 'matches_regex' && typeof node.value === 'string') {
      try {
        new RegExp(node.value);
      } catch (err) {
        errors.push(`Invalid regex in predicate: ${node.value}`);
      }
    }
  } else if (node.type === 'logical') {
    if (!['AND', 'OR', 'NOT'].includes(node.operator)) {
      errors.push(`Invalid logical operator: ${node.operator}`);
    }
    if (!Array.isArray(node.children)) {
      errors.push('Logical node children must be an array');
    } else {
      node.children.forEach((child) => validateNode(child, errors));
    }
  }
}
