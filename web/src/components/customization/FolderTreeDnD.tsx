import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';

export interface CustomFolderItem {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
  count?: number;
  children?: CustomFolderItem[];
}

interface FolderTreeDnDProps {
  onSelectFolder?: (folderId: string) => void;
  onMoveEmailsToFolder?: (emailIds: string[], targetFolderId: string) => void;
}

export const FolderTreeDnD: React.FC<FolderTreeDnDProps> = ({
  onSelectFolder,
  onMoveEmailsToFolder,
}) => {
  const { activeFolderId, setActiveFolderId, playSound, addNotification } = useUI();

  const [folders, setFolders] = useState<CustomFolderItem[]>([
    { id: 'inbox', name: 'Inbox', parentId: null, icon: '📥', count: 12 },
    { id: 'starred', name: 'Starred', parentId: null, icon: '⭐', count: 3 },
    { id: 'sent', name: 'Sent', parentId: null, icon: '📤', count: 45 },
    { id: 'archive', name: 'Archive', parentId: null, icon: '📦', count: 180 },
    { id: 'trash', name: 'Trash', parentId: null, icon: '🗑️', count: 2 },
    { id: 'work', name: 'Work', parentId: null, icon: '💼', count: 8 },
    { id: 'invoices', name: 'Invoices', parentId: 'work', icon: '🧾', count: 5 },
    { id: 'clients', name: 'Clients', parentId: 'work', icon: '👥', count: 3 },
    { id: 'personal', name: 'Personal', parentId: null, icon: '🏠', count: 4 },
  ]);

  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Group into tree
  const rootFolders = folders.filter(f => !f.parentId);
  const getSubFolders = (parentId: string) => folders.filter(f => f.parentId === parentId);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, folderId: string) => {
    if (dragOverFolderId === folderId) {
      setDragOverFolderId(null);
    }
  };

  // Handle Drop onto folder
  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);

    const emailData = e.dataTransfer.getData('application/json');
    let emailIds: string[] = [];

    if (emailData) {
      try {
        const parsed = JSON.parse(emailData);
        emailIds = parsed.emailIds || [parsed.id];
      } catch {
        emailIds = [emailData];
      }
    } else {
      const textId = e.dataTransfer.getData('text/plain');
      if (textId) emailIds = [textId];
    }

    if (emailIds.length > 0) {
      playSound('boop');

      // Optimistic update
      setFolders(prev => prev.map(f => {
        if (f.id === targetFolderId) {
          return { ...f, count: (f.count || 0) + emailIds.length };
        }
        return f;
      }));

      if (onMoveEmailsToFolder) {
        onMoveEmailsToFolder(emailIds, targetFolderId);
      }

      addNotification({
        title: 'Email Moved',
        message: `Moved ${emailIds.length} item(s) to folder "${folders.find(f => f.id === targetFolderId)?.name || targetFolderId}".`,
        type: 'system',
      });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newId = `folder-${Date.now()}`;
    const newFolder: CustomFolderItem = {
      id: newId,
      name: newFolderName.trim(),
      parentId: newFolderParent,
      icon: newFolderParent ? '📁' : '📂',
      count: 0,
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setShowCreateModal(false);

    addNotification({
      title: 'Folder Created',
      message: `Created folder "${newFolder.name}".`,
      type: 'system',
    });
  };

  const renderFolderItem = (folder: CustomFolderItem, depth: number = 0) => {
    const subFolders = getSubFolders(folder.id);
    const isActive = activeFolderId === folder.id;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id} className="space-y-0.5">
        <div
          onClick={() => {
            setActiveFolderId(folder.id);
            if (onSelectFolder) onSelectFolder(folder.id);
          }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={(e) => handleDragLeave(e, folder.id)}
          onDrop={(e) => handleDrop(e, folder.id)}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition text-xs select-none ${
            isDragOver
              ? 'bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500 scale-[1.02]'
              : isActive
              ? 'bg-[var(--mailops-accent)] text-white font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--mailops-text)]'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm shrink-0">{folder.icon || '📁'}</span>
            <span className="truncate">{folder.name}</span>
          </div>
          {folder.count !== undefined && folder.count > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {folder.count}
            </span>
          )}
        </div>

        {/* Render Subfolders */}
        {subFolders.length > 0 && (
          <div className="space-y-0.5">
            {subFolders.map(sub => renderFolderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between px-1">
        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
          Folders & Labels
        </span>
        <button
          onClick={() => {
            setNewFolderParent(null);
            setShowCreateModal(true);
          }}
          className="text-slate-500 hover:text-blue-500 p-0.5 rounded transition"
          title="New Custom Folder"
        >
          + Add
        </button>
      </div>

      {/* Folder Tree Listing */}
      <div className="space-y-0.5">
        {rootFolders.map(f => renderFolderItem(f, 0))}
      </div>

      {/* DnD Helper hint */}
      <div className="px-2 py-2 rounded bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400 border border-[var(--mailops-border)]">
        💡 <strong>Drag & Drop:</strong> Drag any email onto a folder to organize instantly.
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-[var(--mailops-border)] rounded-xl space-y-2 shadow-md">
          <span className="font-semibold text-xs text-[var(--mailops-text)]">
            Create Custom Folder
          </span>
          <input
            type="text"
            placeholder="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)] text-xs"
          />
          <select
            value={newFolderParent || ''}
            onChange={(e) => setNewFolderParent(e.target.value || null)}
            className="w-full px-2 py-1 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)] text-xs"
          >
            <option value="">Root Level</option>
            {folders.filter(f => !f.parentId).map(f => (
              <option key={f.id} value={f.id}>Nest inside: {f.name}</option>
            ))}
          </select>
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-2.5 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              className="px-3 py-1 text-xs font-semibold rounded bg-[var(--mailops-accent)] text-white"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
