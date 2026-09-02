import React from 'react';
import type { ExtractedTask } from '../../context/AIContext';

interface TaskListDrawerProps {
  tasks: ExtractedTask[];
  onToggleTask?: (taskId: string) => void;
  isLoading?: boolean;
}

export const TaskListDrawer: React.FC<TaskListDrawerProps> = ({
  tasks,
  onToggleTask,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 my-3 animate-pulse">
        <div className="h-4 bg-amber-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-amber-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) return null;

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="bg-white border border-amber-200/80 rounded-xl p-4 my-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📋</span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Extracted Action Items</span>
        </div>
        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
          {completedCount} / {tasks.length} Done
        </span>
      </div>

      <ul className="space-y-2">
        {tasks.map(task => (
          <li
            key={task.id}
            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors ${
              task.completed
                ? 'bg-gray-50 border-gray-150 opacity-60'
                : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/60'
            }`}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTask?.(task.id)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.text}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {task.assignee && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-semibold text-blue-700">
                    👤 {task.assignee}
                  </span>
                )}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-[10px] font-semibold text-rose-700">
                    📅 {task.dueDate}
                  </span>
                )}
                {task.confidence && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    {Math.round(task.confidence * 100)}% match
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
