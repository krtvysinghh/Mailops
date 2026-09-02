import React, { useState } from 'react';
import { useCollaboration, type TagNode } from '../../context/CollaborationContext';

interface TagHierarchyTreeProps {
  emailId?: string;
  selectedTagId?: string | null;
  onSelectTag?: (tagId: string | null) => void;
}

export const TagHierarchyTree: React.FC<TagHierarchyTreeProps> = ({
  emailId,
  selectedTagId,
  onSelectTag,
}) => {
  const { tagTree, emailTags, tagEmail, untagEmail, createTag } = useCollaboration();
  const [newTagName, setNewTagName] = useState('');
  const [parentTagId, setParentTagId] = useState<string>('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [showAddForm, setShowAddForm] = useState(false);

  const appliedTags = emailId ? emailTags[emailId] || [] : [];

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim(), tagColor, parentTagId || undefined);
    setNewTagName('');
    setShowAddForm(false);
  };

  const renderTagNode = (node: TagNode) => {
    const isApplied = appliedTags.some(t => t.id === node.id);
    const isSelected = selectedTagId === node.id;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
            isSelected
              ? 'bg-blue-100 text-blue-900 font-semibold'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${Math.max(0.5, node.depth * 1.25)}rem` }}
        >
          <div
            onClick={() => onSelectTag && onSelectTag(isSelected ? null : node.id)}
            className="flex items-center space-x-2 flex-1 cursor-pointer"
          >
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 shrink-0"
              style={{ backgroundColor: node.effectiveColor }}
            />
            <span>{node.name}</span>
          </div>

          {emailId && (
            <button
              onClick={() => {
                if (isApplied) untagEmail(emailId, node.id);
                else tagEmail(emailId, node.id);
              }}
              className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                isApplied
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isApplied ? 'Remove' : '+ Apply'}
            </button>
          )}
        </div>

        {node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map(child => renderTagNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🏷️</span>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Tag Hierarchy</h4>
            <p className="text-xs text-gray-500">Nested label taxonomy with inherited colors</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAddForm ? 'Close' : '+ New Tag'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateTag} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 space-y-2">
          <input
            type="text"
            placeholder="Tag Name (e.g. VIP, Tier2)"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <select
              value={parentTagId}
              onChange={e => setParentTagId(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No Parent (Root Tag)</option>
              <option value="tag-support">Parent: Support</option>
              <option value="tag-sales">Parent: Sales</option>
            </select>
            <input
              type="color"
              value={tagColor}
              onChange={e => setTagColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded"
            >
              Save Tag
            </button>
          </div>
        </form>
      )}

      {/* Applied Tags on Thread */}
      {emailId && appliedTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 pb-2 border-b border-gray-100">
          {appliedTags.map(tag => (
            <span
              key={tag.id}
              className="text-xs px-2.5 py-1 rounded-full text-white font-medium flex items-center space-x-1"
              style={{ backgroundColor: tag.effectiveColor }}
            >
              <span>{tag.fullPath}</span>
              <button
                onClick={() => untagEmail(emailId, tag.id)}
                className="hover:opacity-75 text-[10px] ml-1"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag Taxonomy Tree */}
      <div className="space-y-1">
        {tagTree.map(rootNode => renderTagNode(rootNode))}
      </div>
    </div>
  );
};
