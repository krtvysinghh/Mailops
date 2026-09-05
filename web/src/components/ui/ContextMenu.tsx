import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface ContextMenuAction {
  label: string;
  icon?: string;
  onClick: () => void;
  divider?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  actions: ContextMenuAction[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Calculate position
    const x = e.clientX;
    const y = e.clientY;
    
    setPosition({ x, y });
    setIsOpen(true);
  };

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleScroll = () => {
      if (isOpen) closeMenu();
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeMenu]);

  // Adjust position if it goes off screen
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let adjustedX = position.x;
      let adjustedY = position.y;
      
      if (position.x + rect.width > windowWidth) {
        adjustedX = windowWidth - rect.width - 5;
      }
      
      if (position.y + rect.height > windowHeight) {
        adjustedY = windowHeight - rect.height - 5;
      }
      
      if (adjustedX !== position.x || adjustedY !== position.y) {
        setPosition({ x: adjustedX, y: adjustedY });
      }
    }
  }, [isOpen, position.x, position.y]);

  return (
    <div 
      ref={containerRef} 
      onContextMenu={handleContextMenu}
      style={{ display: 'contents' }}
    >
      {children}
      
      {isOpen && (
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            padding: '4px 0',
            minWidth: '180px',
            zIndex: 1000,
            border: '1px solid #e0e0e0',
            animation: 'fadeIn 0.15s ease-out'
          }}
          className="context-menu"
        >
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.divider && (
                <div style={{ 
                  height: '1px', 
                  backgroundColor: '#e0e0e0', 
                  margin: '4px 0' 
                }} />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  closeMenu();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: action.danger ? '#d32f2f' : '#333',
                  fontSize: '14px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {action.icon && (
                  <span style={{ marginRight: '12px', fontSize: '16px', width: '20px', textAlign: 'center' }}>
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
