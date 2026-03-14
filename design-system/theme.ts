import { Platform } from 'react-native';

export const COLORS = {
  // Backgrounds
  bg: '#FFFCF2',   // Ivory
  bgWarm: '#FFF8E8',   // Warm Cream
  surface: 'rgba(255,252,242,0.55)',  // Glass surface

  // Gold palette
  gold: '#E8B830',   // Bright Gold
  goldMid: '#C8960C',   // Deep Gold
  goldBright: '#FFCF40',   // Highlight
  glow: '#FFD060',   // Shine, shimmer
  goldPale: '#FFF3C4',   // Chip bg, badge bg
  goldSoft: '#FFE8A0',   // Hover bg
  amber: '#B87A08',   // Gradient төгсгөл, dark accent

  // Dividers & borders
  border: 'rgba(200,150,12,0.13)',  // Карт хүрээ
  borderMed: 'rgba(200,150,12,0.22)',  // Input focus, active
  divider: 'rgba(200,150,12,0.07)',  // iOS inset separator

  // Typography
  text: '#1C1200',   // Гол текст
  textSub: '#6B4E1A',   // Дэд текст
  textMute: '#A07838',   // Caption, placeholder
  textFaint: '#C8A858',   // Chevron, hint

  // Semantic
  success: '#15803D',
  error: '#B91C1C',
  warning: '#D97706',

  // Added for compatibility with existing screens
  deepGold: '#A67800',
  textLight: '#F3EAC8',
  textMid: '#A07838',
  card: '#FFFFFF',
  white: '#FFFFFF',
} as const;

export const SHADOWS = {
  // Бүх shadow ЗӨВХӨН gold-based, хэзээ ч #000 хэрэглэхгүй
  xs: {
    shadowColor: '#B87A08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#B87A08',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#B87A08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#C8960C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 7,
  },
  glow: {
    shadowColor: '#E8B830',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    shadowColor: '#B87A08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  gold: {
    shadowColor: '#C8960C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
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
