import React, { useState, useEffect, TouchEvent } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && menuOpen) {
      setMenuOpen(false);
    }
    
    if (isRightSwipe && !menuOpen) {
      setMenuOpen(true);
    }
  };

  if (!isMobile) {
    return <div className="desktop-layout">{children}</div>;
  }

  return (
    <div 
      className="mobile-layout"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
    >
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px', 
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', fontSize: '24px' }}
          aria-label="Toggle Menu"
        >
          ☰
        </button>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Mailops</h1>
        <div style={{ width: '24px' }}></div> {/* Spacer for centering */}
      </header>

      {/* Side drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '250px',
        backgroundColor: '#f5f5f5',
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
        padding: '20px',
        boxShadow: menuOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none'
      }}>
        <h2>Menu</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '10px 0' }}>All Mail</li>
          <li style={{ padding: '10px 0' }}>Drafts</li>
          <li style={{ padding: '10px 0' }}>Spam</li>
          <li style={{ padding: '10px 0' }}>Trash</li>
        </ul>
        <button 
          onClick={() => setMenuOpen(false)}
          style={{ position: 'absolute', top: '10px', right: '10px' }}
        >
          ✕
        </button>
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {children}
      </main>

      <footer style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e0e0e0',
        position: 'relative'
      }}>
        <button style={tabStyle}>
          <span style={iconStyle}>📥</span>
          <span style={labelStyle}>Inbox</span>
        </button>
        <button style={tabStyle}>
          <span style={iconStyle}>🔍</span>
          <span style={labelStyle}>Search</span>
        </button>
        <button style={{
          ...tabStyle,
          position: 'absolute',
          top: '-20px',
          backgroundColor: '#007bff',
          color: 'white',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '24px' }}>+</span>
        </button>
        <div style={{ width: '56px' }}></div> {/* Spacer for FAB */}
        <button style={tabStyle}>
          <span style={iconStyle}>⚙️</span>
          <span style={labelStyle}>Settings</span>
        </button>
      </footer>
    </div>
  );
};

const tabStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: '#666'
};

const iconStyle: React.CSSProperties = {
  fontSize: '20px',
  marginBottom: '4px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px'
};
