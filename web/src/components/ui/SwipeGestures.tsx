import React, { useState, useRef, useEffect } from 'react';

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;  // e.g., Archive
  onSwipeRight: () => void; // e.g., Snooze
  leftActionLabel?: string;
  rightActionLabel?: string;
  leftActionColor?: string;
  rightActionColor?: string;
}

export const SwipeGestures: React.FC<SwipeGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionLabel = 'Archive',
  rightActionLabel = 'Snooze',
  leftActionColor = '#f44336', // Red for Archive
  rightActionColor = '#ff9800', // Orange for Snooze
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  
  // Thresholds
  const SWIPE_THRESHOLD = 80;
  const VELOCITY_THRESHOLD = 0.5;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    currentXRef.current = clientX;
    startTimeRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    currentXRef.current = clientX;
    
    // Calculate new offset, applying some resistance
    const diff = clientX - startXRef.current;
    
    // Add resistance if swiping past threshold
    let newOffset = diff;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      const excess = Math.abs(diff) - SWIPE_THRESHOLD;
      newOffset = Math.sign(diff) * (SWIPE_THRESHOLD + excess * 0.3);
    }
    
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = currentXRef.current - startXRef.current;
    const time = Date.now() - startTimeRef.current;
    const velocity = Math.abs(diff / time);
    
    const isPastThreshold = Math.abs(diff) > SWIPE_THRESHOLD;
    const isFastEnough = velocity > VELOCITY_THRESHOLD;
    
    if (isPastThreshold || isFastEnough) {
      if (diff > 0) {
        // Swipe Right
        setOffset(window.innerWidth); // Animate off screen
        setTimeout(() => {
          onSwipeRight();
          setOffset(0); // Reset after action
        }, 300);
      } else {
        // Swipe Left
        setOffset(-window.innerWidth); // Animate off screen
        setTimeout(() => {
          onSwipeLeft();
          setOffset(0); // Reset after action
        }, 300);
      }
    } else {
      // Snap back
      setOffset(0);
    }
  };

  // Determine background based on swipe direction
  const backgroundColor = offset > 0 ? rightActionColor : leftActionColor;
  
  // Calculate opacity for text based on distance
  const opacity = Math.min(1, Math.abs(offset) / (SWIPE_THRESHOLD * 0.8));

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
      {/* Background actions layer */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor,
          display: 'flex',
          justifyContent: offset > 0 ? 'flex-start' : 'flex-end',
          alignItems: 'center',
          padding: '0 20px',
          color: 'white',
          fontWeight: 'bold',
          opacity: Math.abs(offset) > 10 ? 1 : 0, // Only show when actually swiping
          zIndex: 1
        }}
      >
        <div style={{ opacity, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {offset > 0 ? (
            <>{/* Icon could go here */} <span>{rightActionLabel}</span></>
          ) : (
            <><span>{leftActionLabel}</span> {/* Icon could go here */}</>
          )}
        </div>
      </div>
      
      {/* Foreground content layer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'white', // Ensure child has background so background actions are hidden when offset is 0
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};
