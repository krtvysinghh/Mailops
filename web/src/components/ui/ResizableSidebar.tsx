import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({ 
  children, 
  minWidth = 200, 
  maxWidth = 600, 
  defaultWidth = 250 
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem('mailops_sidebar_width');
    const savedCollapsed = localStorage.getItem('mailops_sidebar_collapsed');
    
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
    
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return;
    
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const newWidth = e.clientX - sidebarRect.left;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
      setIsCollapsed(false);
      localStorage.setItem('mailops_sidebar_width', newWidth.toString());
      localStorage.setItem('mailops_sidebar_collapsed', 'false');
    } else if (newWidth < minWidth / 2) {
      setIsCollapsed(true);
      localStorage.setItem('mailops_sidebar_collapsed', 'true');
    }
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('mailops_sidebar_collapsed', newState.toString());
  };

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      <div 
        ref={sidebarRef}
        style={{
          width: isCollapsed ? '60px' : `${width}px`,
          minWidth: isCollapsed ? '60px' : `${minWidth}px`,
          backgroundColor: '#f8f9fa',
          height: '100%',
          transition: isResizing ? 'none' : 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e0e0e0',
          position: 'relative'
        }}
      >
        <div style={{ padding: '16px', display: 'flex', justifyContent: isCollapsed ? 'center' : 'space-between', alignItems: 'center' }}>
          {!isCollapsed && <span style={{ fontWeight: 'bold' }}>Folders</span>}
          <button 
            onClick={toggleCollapse}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? '➡' : '⬅'}
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
      
      {/* Resizer Handle */}
      {!isCollapsed && (
        <div 
          onMouseDown={handleMouseDown}
          style={{
            width: '6px',
            height: '100%',
            cursor: 'col-resize',
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 10,
            backgroundColor: isResizing ? 'rgba(0, 123, 255, 0.5)' : 'transparent',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        />
      )}
    </div>
  );
};
