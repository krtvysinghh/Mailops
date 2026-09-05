import React, { useState, useRef } from 'react';

interface EmailPreview {
  senderAvatar: string;
  subject: string;
  snippet: string;
  timestamp: string;
  labels: string[];
}

interface EmailPreviewPopoverProps {
  email: EmailPreview;
  children: React.ReactNode;
}

export const EmailPreviewPopover: React.FC<EmailPreviewPopoverProps> = ({ email, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  let timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      }
      setIsHovered(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  return (
    <>
      <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ display: 'inline-block' }}>
        {children}
      </div>
      {isHovered && (
        <div style={{
          position: 'absolute', top: position.top + 8, left: position.left,
          backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, width: '300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <img src={email.senderAvatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <div style={{ marginLeft: '12px', flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{email.subject}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{email.timestamp}</div>
            </div>
          </div>
          <div style={{ fontSize: '14px', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {email.snippet}
          </div>
          <div>
            {email.labels.map(l => (
              <span key={l} style={{ fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};