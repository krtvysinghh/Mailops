/**
 * Generates an SVG avatar from a user's name
 */

const COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', 
  '#ff5722', '#795548', '#607d8b'
];

/**
 * Calculates a deterministic hash for a given string
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Gets a deterministic color based on the name
 */
function getColor(name: string): string {
  const index = hashCode(name) % COLORS.length;
  return COLORS[index];
}

/**
 * Extracts up to two initials from a name
 */
function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates an SVG data URI for an avatar
 */
export function generateAvatar(name: string, size: number = 40): string {
  const initials = getInitials(name);
  const color = getColor(name);
  const fontSize = Math.floor(size * 0.4);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}" />
      <text 
        x="50%" 
        y="50%" 
        dy=".1em"
        fill="#ffffff" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}px" 
        font-weight="500"
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${initials}
      </text>
    </svg>
  `.trim();
  
  // Convert to data URI
  const encodedSvg = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
    
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
}

/**
 * Calculates text color (black or white) based on background color contrast
 * Useful if you want to use the hash color for backgrounds and need readable text
 */
export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
