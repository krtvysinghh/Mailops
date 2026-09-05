import React, { useState } from 'react';

interface EmailItem {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  category: 'primary' | 'updates';
}

interface SplitInboxViewProps {
  emails: EmailItem[];
  onEmailClick: (id: string) => void;
}

export const SplitInboxView: React.FC<SplitInboxViewProps> = ({ emails, onEmailClick }) => {
  const [isSplitView, setIsSplitView] = useState(true);

  const primaryEmails = emails.filter(e => e.category === 'primary');
  const updateEmails = emails.filter(e => e.category === 'updates');

  const EmailList = ({ items, title }: { items: EmailItem[], title?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {title && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#f5f5f5', 
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 'bold',
          color: '#333'
        }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No emails</div>
        ) : (
          items.map(email => (
            <div 
              key={email.id}
              onClick={() => onEmailClick(email.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 'bold', color: '#202124' }}>{email.sender}</span>
                <span style={{ fontSize: '12px', color: '#5f6368' }}>{email.time}</span>
              </div>
              <div style={{ fontWeight: '500', color: '#202124', fontSize: '14px' }}>
                {email.subject}
              </div>
              <div style={{ color: '#5f6368', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email.preview}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Toolbar */}
      <div style={{ 
        padding: '8px 16px', 
        borderBottom: '1px solid #e0e0e0', 
        display: 'flex', 
        justifyContent: 'flex-end' 
      }}>
        <button
          onClick={() => setIsSplitView(!isSplitView)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#fff',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#3c4043',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isSplitView ? 'View Combined' : 'View Split'}
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isSplitView ? (
          <>
            {/* Primary Pane */}
            <div style={{ flex: 1, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
              <EmailList items={primaryEmails} title="Primary" />
            </div>
            
            {/* Updates Pane */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <EmailList items={updateEmails} title="Updates" />
            </div>
          </>
        ) : (
          <div style={{ flex: 1 }}>
            <EmailList items={emails} title="All Inbox" />
          </div>
        )}
      </div>
    </div>
  );
};
