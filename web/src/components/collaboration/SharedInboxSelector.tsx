import React, { useState } from 'react';
import { useCollaboration, type InboxRole } from '../../context/CollaborationContext';

export const SharedInboxSelector: React.FC = () => {
  const { inboxes, activeInboxId, setActiveInboxId, createInbox } = useCollaboration();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInboxName, setNewInboxName] = useState('');
  const [newInboxDesc, setNewInboxDesc] = useState('');

  const activeInbox = inboxes.find(i => i.id === activeInboxId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInboxName.trim()) return;
    await createInbox(newInboxName.trim(), newInboxDesc.trim());
    setNewInboxName('');
    setNewInboxDesc('');
    setShowCreateModal(false);
  };

  const getRoleBadge = (role: InboxRole) => {
    switch (role) {
      case 'owner':
        return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">Owner</span>;
      case 'admin':
        return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">Admin</span>;
      case 'member':
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Member</span>;
      case 'viewer':
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-medium">Viewer</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">👥</span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Shared Team Inboxes</h3>
            <p className="text-xs text-gray-500">Multi-user queues with granular RBAC permissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1.5 rounded-md flex items-center space-x-1"
        >
          <span>+ New Inbox</span>
        </button>
      </div>

      {/* Inbox Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {inboxes.map(inbox => {
          const isActive = inbox.id === activeInboxId;
          return (
            <div
              key={inbox.id}
              onClick={() => setActiveInboxId(inbox.id)}
              className={`cursor-pointer p-3 rounded-md border transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-400'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-900">{inbox.name}</span>
                {getRoleBadge(inbox.role)}
              </div>
              {inbox.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{inbox.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {activeInbox && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <span>Active: <strong className="text-gray-900">{activeInbox.name}</strong></span>
          <span>Access Level: <strong className="capitalize text-gray-900">{activeInbox.role}</strong></span>
        </div>
      )}

      {/* Create Inbox Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-gray-100">
            <h4 className="text-base font-bold text-gray-900 mb-1">Create Shared Inbox</h4>
            <p className="text-xs text-gray-500 mb-4">Set up a shared team mailbox with RBAC access control.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Inbox Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Billing Support"
                  value={newInboxName}
                  onChange={e => setNewInboxName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of this inbox..."
                  value={newInboxDesc}
                  onChange={e => setNewInboxDesc(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs"
                >
                  Create Inbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
