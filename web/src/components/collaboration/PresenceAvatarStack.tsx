import React, { useEffect } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';

interface PresenceAvatarStackProps {
  emailId: string;
}

export const PresenceAvatarStack: React.FC<PresenceAvatarStackProps> = ({ emailId }) => {
  const { presenceMap, collisionState, sendPresenceHeartbeat, currentUserId } = useCollaboration();

  // Periodic heartbeat
  useEffect(() => {
    sendPresenceHeartbeat(emailId, 'viewing');
    const interval = setInterval(() => {
      sendPresenceHeartbeat(emailId, 'viewing');
    }, 15000);
    return () => clearInterval(interval);
  }, [emailId]);

  const activeUsers = presenceMap[emailId] || [];
  const otherUsers = activeUsers.filter(u => u.userId !== currentUserId);

  return (
    <div className="space-y-2">
      {/* Collision Warning Banner */}
      {collisionState?.hasCollision && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-2 rounded-lg flex items-center space-x-2 animate-pulse">
          <span className="text-base">⚠️</span>
          <div className="flex-1 font-medium">
            {collisionState.warningMessage || 'Another team member is drafting a reply on this thread!'}
          </div>
          <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded font-bold uppercase">
            Collision Risk
          </span>
        </div>
      )}

      {/* Active Avatar Stack */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 font-medium">Viewing now:</span>
        <div className="flex -space-x-1.5 overflow-hidden">
          {activeUsers.map(user => (
            <div
              key={user.userId}
              title={`${user.userName} (${user.action})`}
              className={`inline-block h-6 w-6 rounded-full ring-2 ring-white text-[10px] font-bold flex items-center justify-center text-white relative ${
                user.action === 'drafting' ? 'bg-amber-500 animate-bounce' : 'bg-blue-600'
              }`}
            >
              {user.userName.charAt(0)}
              {user.action === 'drafting' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-300 rounded-full ring-1 ring-white" />
              )}
            </div>
          ))}
        </div>
        {otherUsers.length > 0 && (
          <span className="text-[11px] text-gray-600">
            {otherUsers.map(u => u.userName).join(', ')} online
          </span>
        )}
      </div>
    </div>
  );
};
