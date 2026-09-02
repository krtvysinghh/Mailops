import React, { useState } from 'react';

export interface ThreadTreeNode {
  id: string;
  messageId?: string;
  email?: {
    id: string;
    fromAddr: string;
    toAddr?: string;
    subject?: string;
    textBody?: string;
    createdAt: number | Date | string;
    read?: boolean;
    starred?: boolean;
  };
  children: ThreadTreeNode[];
  depth: number;
  isDummy: boolean;
  subtreeMessageCount: number;
}

interface ThreadTreeViewProps {
  tree: ThreadTreeNode;
  onSelectEmail?: (emailId: string) => void;
}

const NodeRenderer: React.FC<{
  node: ThreadTreeNode;
  onSelectEmail?: (emailId: string) => void;
}> = ({ node, onSelectEmail }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const dateStr = node.email?.createdAt
    ? new Date(node.email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="flex flex-col" style={{ marginLeft: `${node.depth * 20}px` }}>
      <div
        className={`my-1 p-3 rounded-xl border transition cursor-pointer ${
          node.isDummy
            ? 'border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/50 shadow-sm'
        }`}
        onClick={() => {
          if (node.email?.id) onSelectEmail?.(node.email.id);
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {node.children.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 px-1"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}

            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
              {node.email?.fromAddr ? node.email.fromAddr[0].toUpperCase() : '?'}
            </div>

            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
              {node.email?.fromAddr || '(Missing Parent Reference)'}
            </span>

            {node.isDummy && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Grafted Root
              </span>
            )}
          </div>

          <span className="text-[11px] text-zinc-400">{dateStr}</span>
        </div>

        {node.email?.subject && (
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1 pl-8">
            {node.email.subject}
          </p>
        )}

        {node.email?.textBody && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 pl-8 line-clamp-1">
            {node.email.textBody}
          </p>
        )}
      </div>

      {isExpanded && node.children.length > 0 && (
        <div className="border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 pl-2 space-y-1">
          {node.children.map((child) => (
            <NodeRenderer key={child.id} node={child} onSelectEmail={onSelectEmail} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ThreadTreeView: React.FC<ThreadTreeViewProps> = ({ tree, onSelectEmail }) => {
  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
        <span className="font-medium">JWZ RFC 5322 Thread Tree ({tree.subtreeMessageCount} messages)</span>
      </div>
      <NodeRenderer node={tree} onSelectEmail={onSelectEmail} />
    </div>
  );
};
