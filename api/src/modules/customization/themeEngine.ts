/**
 * Feature 41: Dark Mode & Dynamic Color Themes
 * Pure TypeScript theme engine with CSS variable generation,
 * system preference detection logic, and WCAG AA/AAA contrast ratio validation.
 */

export type ThemeMode = 'light' | 'dark' | 'solarized' | 'high-contrast' | 'system';
export type DensityMode = 'compact' | 'normal' | 'comfortable';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  borderHover: string;
  accent: string;
  accentHover: string;
  accentForeground: string;
  cardBg: string;
  sidebarBg: string;
  activeItemBg: string;
  unreadBadgeBg: string;
  unreadBadgeText: string;
  danger: string;
  success: string;
  warning: string;
}

export interface ThemeDefinition {
  id: ThemeMode;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const THEMES: Record<Exclude<ThemeMode, 'system'>, ThemeDefinition> = {
  light: {
    id: 'light',
    name: 'Clean Light',
    isDark: false,
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8fafc',
      bgTertiary: '#f1f5f9',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      borderColor: '#e2e8f0',
      borderHover: '#cbd5e1',
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      accentForeground: '#ffffff',
      cardBg: '#ffffff',
      sidebarBg: '#f8fafc',
      activeItemBg: '#eff6ff',
      unreadBadgeBg: '#2563eb',
      unreadBadgeText: '#ffffff',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
    },
  },
  dark: {
    id: 'dark',
    name: 'Midnight Dark',
    isDark: true,
    colors: {
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      borderColor: '#334155',
      borderHover: '#475569',
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      accentForeground: '#ffffff',
      cardBg: '#1e293b',
      sidebarBg: '#0b1120',
      activeItemBg: '#1e3a8a',
      unreadBadgeBg: '#3b82f6',
      unreadBadgeText: '#ffffff',
      danger: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
    },
  },
  solarized: {
    id: 'solarized',
    name: 'Solarized Dark',
    isDark: true,
    colors: {
      bgPrimary: '#002b36',
      bgSecondary: '#073642',
      bgTertiary: '#586e75',
      textPrimary: '#839496',
      textSecondary: '#93a1a1',
      textMuted: '#657b83',
      borderColor: '#073642',
      borderHover: '#586e75',
      accent: '#268bd2',
      accentHover: '#2aa198',
      accentForeground: '#fdf6e3',
      cardBg: '#073642',
      sidebarBg: '#00212b',
      activeItemBg: '#073642',
      unreadBadgeBg: '#268bd2',
      unreadBadgeText: '#fdf6e3',
      danger: '#dc322f',
      success: '#859900',
      warning: '#b58900',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast (A11y)',
    isDark: true,
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#121212',
      bgTertiary: '#242424',
      textPrimary: '#ffffff',
      textSecondary: '#ffff00',
      textMuted: '#00ffff',
      borderColor: '#ffffff',
      borderHover: '#ffff00',
      accent: '#ffff00',
      accentHover: '#ffffff',
      accentForeground: '#000000',
      cardBg: '#000000',
      sidebarBg: '#000000',
      activeItemBg: '#333333',
      unreadBadgeBg: '#ffff00',
      unreadBadgeText: '#000000',
      danger: '#ff5555',
      success: '#55ff55',
      warning: '#ffff55',
    },
  },
};

/**
 * Converts a hex color (#RRGGBB or #RGB) to sRGB normalized components.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates the relative luminance of a color according to WCAG 2.1 specs.
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = transform(r);
  const G = transform(g);
  const B = transform(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the WCAG contrast ratio between two hex colors.
 * Returns ratio from 1 to 21.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Evaluates WCAG 2.1 compliance level for given contrast ratio.
 */
export function evaluateContrastCompliance(ratio: number, isLargeText: boolean = false): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
} {
  const minAA = isLargeText ? 3.0 : 4.5;
  const minAAA = isLargeText ? 4.5 : 7.0;
  return {
    ratio,
    aa: ratio >= minAA,
    aaa: ratio >= minAAA,
  };
}

/**
 * Generates CSS custom properties (variables) dictionary for a given theme and optional custom accent.
 */
export function generateCssVariables(
  themeMode: ThemeMode,
  systemPrefersDark: boolean = false,
  customAccent?: string
): Record<string, string> {
  const effectiveTheme: Exclude<ThemeMode, 'system'> =
    themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  const themeDef = THEMES[effectiveTheme] || THEMES.light;
  const colors = { ...themeDef.colors };

  if (customAccent && /^#[0-9A-Fa-f]{6}$/.test(customAccent)) {
    colors.accent = customAccent;
    // Calculate suitable foreground text based on contrast
    const whiteRatio = getContrastRatio(customAccent, '#ffffff');
    colors.accentForeground = whiteRatio >= 4.5 ? '#ffffff' : '#000000';
  }

  return {
    '--color-bg-primary': colors.bgPrimary,
    '--color-bg-secondary': colors.bgSecondary,
    '--color-bg-tertiary': colors.bgTertiary,
    '--color-text-primary': colors.textPrimary,
    '--color-text-secondary': colors.textSecondary,
    '--color-text-muted': colors.textMuted,
    '--color-border': colors.borderColor,
    '--color-border-hover': colors.borderHover,
    '--color-accent': colors.accent,
    '--color-accent-hover': colors.accentHover,
    '--color-accent-fg': colors.accentForeground,
    '--color-card-bg': colors.cardBg,
    '--color-sidebar-bg': colors.sidebarBg,
    '--color-active-item': colors.activeItemBg,
    '--color-unread-badge-bg': colors.unreadBadgeBg,
    '--color-unread-badge-text': colors.unreadBadgeText,
    '--color-danger': colors.danger,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--theme-name': themeDef.id,
    '--theme-is-dark': themeDef.isDark ? '1' : '0',
  };
}

/**
 * Generates density CSS variables for compact, normal, comfortable modes.
 */
export function generateDensityVariables(density: DensityMode): Record<string, string> {
  switch (density) {
    case 'compact':
      return {
        '--density-row-padding-y': '4px',
        '--density-row-padding-x': '8px',
        '--density-font-size': '13px',
        '--density-avatar-size': '24px',
        '--density-gap': '4px',
      };
    case 'comfortable':
      return {
        '--density-row-padding-y': '12px',
        '--density-row-padding-x': '16px',
        '--density-font-size': '15px',
        '--density-avatar-size': '36px',
        '--density-gap': '10px',
      };
    case 'normal':
    default:
      return {
        '--density-row-padding-y': '8px',
        '--density-row-padding-x': '12px',
        '--density-font-size': '14px',
        '--density-avatar-size': '30px',
        '--density-gap': '6px',
      };
  }
}
