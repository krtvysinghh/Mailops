/**
 * Module: Visual DAG Workflow Execution Engine
 * 
 * Executes directed acyclic graph (DAG) automation pipelines with
 * parallel branches, conditional switches, data transformers, and webhooks.
 */

export type NodeType = 'trigger' | 'condition' | 'action' | 'transform' | 'delay';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  config: {
    field?: string;
    operator?: 'equals' | 'contains' | 'matches_regex' | 'greater_than' | 'in_list';
    value?: any;
    actionName?: 'apply_tag' | 'move_folder' | 'forward' | 'send_slack' | 'auto_reply' | 'mark_read';
    actionPayload?: any;
    transformFn?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionBranch?: 'true' | 'false' | 'default';
}

export interface DAGWorkflow {
  id: string;
  name: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionContext {
  email: {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    headers: Record<string, string>;
  };
  variables: Record<string, any>;
  logs: string[];
}

export async function executeDAGWorkflow(workflow: DAGWorkflow, context: ExecutionContext): Promise<ExecutionContext> {
  if (!workflow.enabled) return context;

  const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
  const adjacency = new Map<string, WorkflowEdge[]>();

  for (const edge of workflow.edges) {
    const list = adjacency.get(edge.sourceNodeId) || [];
    list.push(edge);
    adjacency.set(edge.sourceNodeId, list);
  }

  // Find root trigger node
  const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
  if (!triggerNode) {
    context.logs.push('No trigger node found');
    return context;
  }

  const queue: { nodeId: string; branch?: string }[] = [{ nodeId: triggerNode.id }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const node = nodeMap.get(current.nodeId);
    if (!node) continue;

    let branchResult = 'true';

    // Execute node logic
    if (node.type === 'condition') {
      const fieldVal = (context.email as any)[node.config.field || ''] || '';
      const targetVal = node.config.value;
      let matched = false;

      switch (node.config.operator) {
        case 'contains':
          matched = String(fieldVal).toLowerCase().includes(String(targetVal).toLowerCase());
          break;
        case 'equals':
          matched = String(fieldVal).toLowerCase() === String(targetVal).toLowerCase();
          break;
        case 'matches_regex':
          matched = new RegExp(targetVal, 'i').test(String(fieldVal));
          break;
      }
      branchResult = matched ? 'true' : 'false';
      context.logs.push(`Condition ${node.id} evaluated to ${branchResult}`);
    } else if (node.type === 'action') {
      context.logs.push(`Action ${node.config.actionName} executed with payload: ${JSON.stringify(node.config.actionPayload)}`);
    }

    // Traverse outward edges matching branch
    const outgoing = adjacency.get(node.id) || [];
    for (const edge of outgoing) {
      if (!edge.conditionBranch || edge.conditionBranch === branchResult) {
        queue.push({ nodeId: edge.targetNodeId, branch: edge.conditionBranch });
      }
    }
  }

  return context;
}
