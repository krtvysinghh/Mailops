/**
 * Accessibility utility functions for Mailops
 */

/**
 * Traps focus within a given container element.
 * Useful for modals and focus management.
 */
export function trapFocus(element: HTMLElement) {
  const focusableEls = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableEls.length === 0) return () => {};
  
  const firstFocusableEl = focusableEls[0] as HTMLElement;
  const lastFocusableEl = focusableEls[focusableEls.length - 1] as HTMLElement;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
    
    if (!isTabPressed) {
      return;
    }
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Creates an aria-live region and announces text to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  let announcer = document.getElementById('a11y-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    Object.assign(announcer.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0'
    });
    document.body.appendChild(announcer);
  } else {
    announcer.setAttribute('aria-live', priority);
  }
  
  // Clear first to ensure repeat messages are read
  announcer.textContent = '';
  
  // Small delay to ensure the screen reader detects the change
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 50);
}

/**
 * Generates comprehensive ARIA labels for an email item
 */
export function generateAriaLabels(email: {
  sender: string;
  subject: string;
  date: string;
  unread: boolean;
  hasAttachments: boolean;
}) {
  const unreadState = email.unread ? 'Unread' : 'Read';
  const attachmentState = email.hasAttachments ? 'has attachments' : '';
  
  return `${unreadState} email from ${email.sender}, subject: ${email.subject}, received ${email.date}. ${attachmentState}`.trim();
}

/**
 * Helper for implementing keyboard navigation in lists (arrow keys)
 */
export function setupListKeyboardNavigation(listId: string) {
  const list = document.getElementById(listId);
  if (!list) return () => {};
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    if (!list.contains(activeElement)) return;
    
    const items = Array.from(list.querySelectorAll('[role="listitem"], li, [tabindex="0"]')) as HTMLElement[];
    const currentIndex = items.indexOf(activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
        e.preventDefault();
        break;
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        e.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        nextIndex = items.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }
    
    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
    }
  };
  
  list.addEventListener('keydown', handleKeyDown);
  
  return () => {
    list.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Generates a skip-to-content link element
 */
export function createSkipLink(targetId: string = 'main-content', text: string = 'Skip to main content') {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'skip-link';
  
  // Ensure styles are added for the skip link
  const styleId = 'skip-link-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: white;
        padding: 8px;
        z-index: 10000;
        transition: top 0.2s ease-out;
        text-decoration: none;
      }
      .skip-link:focus {
        top: 0;
      }
    `;
    document.head.appendChild(style);
  }
  
  return link;
}
