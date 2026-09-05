import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

export interface UndoToastOptions {
  message: string;
  onUndo: () => void;
  duration?: number;
}

let toastRoot: any = null;

const ToastContainer: React.FC<{ options: UndoToastOptions; onDismiss: () => void }> = ({ 
  options, 
  onDismiss 
}) => {
  const { message, onUndo, duration = 5000 } = options;
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsClosing(true);
    setTimeout(onDismiss, 300); // Wait for exit animation
  }, [onDismiss]);

  const handleUndo = () => {
    onUndo();
    handleDismiss();
  };

  useEffect(() => {
    if (isPaused) return;
    
    const startTime = Date.now();
    const endTime = startTime + (duration * (progress / 100));
    
    let animationFrameId: number;
    
    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      
      setProgress(newProgress);
      
      if (newProgress > 0) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        handleDismiss();
      }
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [duration, handleDismiss, isPaused, progress]);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        backgroundColor: '#323232',
        color: 'white',
        borderRadius: '4px',
        boxShadow: '0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '288px',
        maxWidth: '568px',
        overflow: 'hidden',
        zIndex: 9999,
        transform: isClosing ? 'translateY(150%)' : 'translateY(0)',
        opacity: isClosing ? 0 : 1,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px'
      }}>
        <span style={{ fontSize: '14px', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
          {message}
        </span>
        
        <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
          <button 
            onClick={handleUndo}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffb74d',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '6px 8px',
              borderRadius: '4px',
            }}
          >
            Undo
          </button>
          
          <button 
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        height: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: '100%'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: '#ffb74d',
          width: `${progress}%`,
        }} />
      </div>
    </div>
  );
};

export function showUndoToast(options: UndoToastOptions) {
  let container = document.getElementById('mailops-toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'mailops-toast-container';
    document.body.appendChild(container);
  }
  
  if (!toastRoot) {
    toastRoot = createRoot(container);
  }
  
  const dismiss = () => {
    if (toastRoot) {
      toastRoot.unmount();
      toastRoot = null;
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
  
  toastRoot.render(<ToastContainer options={options} onDismiss={dismiss} />);
}
