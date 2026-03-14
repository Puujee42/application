import { Platform } from 'react-native';

export const COLORS = {
  // Backgrounds
  bg: '#FFFFFF',   // Pure white
  bgWarm: '#FFFCF5',   // Warm divine white
  surface: 'rgba(255, 255, 255, 0.85)',  // Glass surface

  // Divine Yellow palette (keeping keys like 'gold'/'amber' for backward compatibility)
  gold: '#FACC15',   // Divine Yellow (Main accent)
  goldMid: '#EAB308',   // Deeper Divine Yellow
  goldBright: '#FEF08A',   // Highlight / glow
  glow: '#FEF08A',   // Shine, shimmer
  goldPale: '#FEF9C3',   // Chip bg, badge bg
  goldSoft: '#FCF5DF',   // Hover bg
  amber: '#CA8A04',   // Gradient end, dark accent

  // Dividers & borders
  border: 'rgba(250, 204, 21, 0.2)',  // Карт хүрээ
  borderMed: 'rgba(250, 204, 21, 0.4)',  // Input focus, active
  divider: 'rgba(250, 204, 21, 0.15)',  // iOS inset separator

  // Typography
  text: '#332900',   // Deep golden brown (Softer than pure black)
  textSub: '#715A00',   // Muted brown
  textMute: '#A18200',   // Caption, placeholder
  textFaint: '#D4AA00',   // Chevron, hint

  // Semantic
  success: '#34D399',
  error: '#FB7185', // Soft rose red
  warning: '#FBBF24', // Soft golden yellow

  // Added for compatibility with existing screens
  deepGold: '#EAB308', // Soft gold
  textLight: '#FEF9C3', // Light gold
  textMid: '#A18200',
  card: '#FFFFFF',
  white: '#FFFFFF',
} as const;

export const SHADOWS = {
  // Shadows based on soft divine yellow
  xs: {
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 7,
  },
  glow: {
    shadowColor: '#FEF08A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#715A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  gold: {
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

// Typography helper — font бүх дэлгэцэнд ижил
export const FONT = {
  display: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  body: Platform.OS === 'ios' ? 'System' : 'sans-serif',
} as const;

export type ColorKey = keyof typeof COLORS;
export type ShadowKey = keyof typeof SHADOWS;
