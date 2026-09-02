import React, { useState } from 'react';
import { useCollaboration, type AssignmentStatus } from '../../context/CollaborationContext';

interface AssignmentBadgeProps {
  emailId: string;
}

export const AssignmentBadge: React.FC<AssignmentBadgeProps> = ({ emailId }) => {
  const { assignments, assignEmail } = useCollaboration();
  const [isOpen, setIsOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const currentAssignment = assignments[emailId];
  const assignedUserId = currentAssignment?.assignedToUserId;
  const status: AssignmentStatus = currentAssignment?.status || 'unassigned';

  const teamMembers = [
    { id: 'user-1', name: 'Alex Chen (You)', initials: 'AC' },
    { id: 'user-2', name: 'Sarah Connor', initials: 'SC' },
    { id: 'user-3', name: 'Dave Bowman', initials: 'DB' },
  ];

  const assignedMember = teamMembers.find(m => m.id === assignedUserId);

  const getStatusBadge = (st: AssignmentStatus) => {
    switch (st) {
      case 'in_progress':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-medium">In Progress</span>;
      case 'waiting':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-medium">Waiting</span>;
      case 'resolved':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-medium">Resolved</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium">Unassigned</span>;
    }
  };

  const handleAssign = async (userId: string | null, newStatus?: AssignmentStatus) => {
    await assignEmail(emailId, userId, newStatus, noteText.trim() || undefined);
    setNoteText('');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-1.5">
          {assignedMember ? (
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {assignedMember.initials}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[10px] font-bold flex items-center justify-center">
              ?
            </div>
          )}
          <span className="text-xs font-medium text-gray-800">
            {assignedMember ? assignedMember.name : 'Unassigned'}
          </span>
        </div>
        {getStatusBadge(status)}
        <span className="text-[10px] text-gray-400">▼</span>
      </button>

      {/* Assignment Dropdown Menu */}
      {isOpen && (
        <div className="origin-top-right absolute left-0 sm:right-0 mt-2 w-72 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 p-2">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-gray-700">Assign To Team Member</p>
          </div>

          <div className="py-1 space-y-0.5">
            {teamMembers.map(member => (
              <button
                key={member.id}
                onClick={() => handleAssign(member.id, 'in_progress')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                  assignedUserId === member.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {member.initials}
                  </div>
                  <span>{member.name}</span>
                </div>
                {assignedUserId === member.id && <span>✓</span>}
              </button>
            ))}

            <button
              onClick={() => handleAssign(null, 'unassigned')}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <span>✕</span>
              <span>Mark Unassigned</span>
            </button>
          </div>

          {/* Status Section */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-700 px-2 mb-1.5">Update Lifecycle Status</p>
            <div className="grid grid-cols-2 gap-1 px-1">
              {(['in_progress', 'waiting', 'resolved', 'unassigned'] as AssignmentStatus[]).map(st => (
                <button
                  key={st}
                  onClick={() => handleAssign(assignedUserId, st)}
                  className={`text-xs px-2 py-1 rounded text-center capitalize transition-colors ${
                    status === st
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="pt-2 mt-2">
            <input
              type="text"
              placeholder="Add delegation note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
