/**
 * Luminous Gold Sanctuary — Typography System
 * Uses Georgia (serif) for headings and System (sans) for body.
 */

export const Typography = {
    family: {
        serif: 'Georgia',   // Sanctuary headings
        sans: 'System',     // Body text
    },
    size: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
    weight: {
        light: '300' as const,
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },
    letterSpacing: {
        tighter: -0.8,
        tight: -0.4,
        normal: 0,
        wide: 0.4,
        wider: 0.8,
        widest: 1.6,
    },
};
