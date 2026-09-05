/**
 * Browser tab notification badge utility
 */

let originalTitle = document.title || 'Mailops';
let originalFavicon: string | null = null;

/**
 * Updates the browser tab title and favicon with a notification badge
 */
export function updateTabBadge(count: number): void {
  // Update document title
  if (count > 0) {
    document.title = `(${count}) ${originalTitle}`;
  } else {
    document.title = originalTitle;
  }

  // Update favicon with visual badge
  updateFaviconBadge(count);
}

/**
 * Draws a notification badge on the favicon
 */
function updateFaviconBadge(count: number): void {
  const link = getFaviconLink();
  
  if (!originalFavicon) {
    originalFavicon = link.href;
  }

  if (count <= 0) {
    link.href = originalFavicon;
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    // Draw original favicon
    ctx.drawImage(img, 0, 0, 32, 32);
    
    // Draw badge background
    ctx.beginPath();
    ctx.arc(22, 10, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#d32f2f'; // Red badge
    ctx.fill();
    
    // Draw badge text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Adjust font size for larger numbers
    const text = count > 99 ? '99+' : count.toString();
    ctx.font = count > 9 ? 'bold 10px Arial' : 'bold 12px Arial';
    
    ctx.fillText(text, 22, 10);
    
    // Update favicon
    link.href = canvas.toDataURL('image/png');
  };
  
  img.src = originalFavicon;
}

/**
 * Gets or creates the favicon link element
 */
function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

/**
 * Stores the original title when initialized
 */
export function initTabBadge(title: string): void {
  originalTitle = title;
  document.title = title;
}
