import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import { SharedInboxSelector } from './SharedInboxSelector';
import { AssignmentBadge } from './AssignmentBadge';
import { InternalNotesPanel } from './InternalNotesPanel';
import { PresenceAvatarStack } from './PresenceAvatarStack';
import { DraftCoauthoringModal } from './DraftCoauthoringModal';
import { MentionNotificationsFeed } from './MentionNotificationsFeed';
import { AuditTimeline } from './AuditTimeline';
import { ShareLinkModal } from './ShareLinkModal';
import { TagHierarchyTree } from './TagHierarchyTree';
import { CRMSidebar } from './CRMSidebar';

export const CollaborationDashboard: React.FC = () => {
  const { currentUserId, setCurrentUser } = useCollaboration();
  const [activeTab, setActiveTab] = useState<'threads' | 'drafts' | 'crm' | 'tags'>('threads');
  const selectedEmailId = 'msg-1';

  return (
    <div className="space-y-6">
      {/* Top Collaboration Hub Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl text-white p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-black tracking-tight">Collaboration & Multiplayer Hub</h2>
            </div>
            <p className="text-blue-100 text-xs max-w-xl">
              Real-time multi-user shared inboxes, collision detection, delegation lifecycles, internal discussions,
              optimistic draft merging, tamper-evident audit logs, and customer CRM intelligence.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
            <div className="text-right text-xs">
              <div className="text-blue-200 text-[10px] uppercase font-bold tracking-wider">Simulate Actor</div>
              <select
                value={currentUserId}
                onChange={e => {
                  const id = e.target.value;
                  const name = id === 'user-1' ? 'Alex Chen' : id === 'user-2' ? 'Sarah Connor' : 'Dave Bowman';
                  setCurrentUser(id, name);
                }}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="user-1" className="text-gray-900">Alex Chen (Owner)</option>
                <option value="user-2" className="text-gray-900">Sarah Connor (Admin)</option>
                <option value="user-3" className="text-gray-900">Dave Bowman (Member)</option>
              </select>
            </div>
            <MentionNotificationsFeed />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mt-6 pt-4 border-t border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'threads'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            📬 Thread Collaboration & Notes
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'drafts'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            ✍️ Collaborative Drafts & 3-Way Diff
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'crm'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            👤 Customer Context & Mini CRM
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'tags'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            🏷️ Tag Taxonomy & Labels
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'threads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Shared Inboxes & Hierarchy */}
          <div className="space-y-6">
            <SharedInboxSelector />
            <TagHierarchyTree emailId={selectedEmailId} />
          </div>

          {/* Center Column: Thread View & Internal Notes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              {/* Thread Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-400">#9021</span>
                    <h3 className="text-base font-bold text-gray-900">
                      Inquiry regarding Enterprise plan & SLA terms
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500">From: customer@enterprise.com to support@mailops.dev</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AssignmentBadge emailId={selectedEmailId} />
                  <ShareLinkModal threadId="thread-101" />
                </div>
              </div>

              {/* Real-time Presence & Collision Stack */}
              <div className="my-4">
                <PresenceAvatarStack emailId={selectedEmailId} />
              </div>

              {/* Email Body */}
              <div className="bg-gray-50 rounded-xl p-4 my-4 border border-gray-200 text-xs text-gray-800 leading-relaxed space-y-2">
                <p>Hello Mailops Support,</p>
                <p>
                  We are finalizing our annual enterprise budget and would like to confirm our SLA terms,
                  specifically guaranteed uptime and dedicated priority support response channels.
                </p>
                <p>Could your enterprise solutions team send over the latest draft SLA addendum?</p>
                <p className="pt-2 font-medium">Best regards,<br/>Sarah Connor, VP Technology at Enterprise Inc.</p>
              </div>

              {/* Feature 23: Internal Notes & Private Comments */}
              <InternalNotesPanel emailId={selectedEmailId} />
            </div>

            {/* Feature 27: Audit Log Timeline */}
            <AuditTimeline />
          </div>
        </div>
      )}

      {activeTab === 'drafts' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <DraftCoauthoringModal />
        </div>
      )}

      {activeTab === 'crm' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <CRMSidebar senderEmail="customer@enterprise.com" />
          <div className="space-y-6">
            <AuditTimeline />
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="max-w-3xl mx-auto">
          <TagHierarchyTree emailId={selectedEmailId} />
        </div>
      )}
    </div>
  );
};
