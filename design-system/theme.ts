/**
 * Luminous Gold Sanctuary — Design System
 * 
 * COLORS: Warm ivory backgrounds, rich gold accents, deep amber tones.
 * SHADOWS: Card and gold-glow presets for consistent elevation.
 */

export const COLORS = {
    // ── Backgrounds ──
    bg: '#FFFBF0',
    bgWarm: '#FFF8E6',

    // ── Gold palette ──
    gold: '#D4A020',
    deepGold: '#B8820A',
    glow: '#FFD060',
    goldLight: '#F0B429',
    goldPale: '#FFF3C4',
    goldSoft: '#FFE8A0',
    amber: '#E89010',

    // ── Borders ──
    border: 'rgba(200,146,10,0.18)',
    borderGlow: 'rgba(240,180,40,0.45)',

    // ── Typography ──
    text: '#1A1000',
    textMid: '#5C4A1E',
    textLight: '#8B7340',

    // ── Semantic ──
    error: '#DC2626',
    success: '#16A34A',
} as const;

export const SHADOWS = {
    card: {
        shadowColor: '#B8820A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    gold: {
        shadowColor: '#FFD060',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
} as const;

export type ColorKey = keyof typeof COLORS;
export type ShadowKey = keyof typeof SHADOWS;
