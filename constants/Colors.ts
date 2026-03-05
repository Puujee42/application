/**
 * Luminous Gold Sanctuary — Color Palette
 * A warm, radiant, sanctuary-inspired palette with deep gold accents.
 */

export const Colors = {
    light: {
        text: '#1A1000',         // Deep Bronze
        background: '#FFFBF0',   // Warm Ivory
        tint: '#D4A020',         // Primary Gold
        icon: '#B8820A',         // Deep Gold
        tabIconDefault: '#B8820A80', // Muted Gold
        tabIconSelected: '#D4A020',
        border: 'rgba(200,146,10,0.18)', // Gold Glass Border
    },
    dark: {
        // Keep luminous — no dark mode shift
        text: '#1A1000',
        background: '#FFFBF0',
        tint: '#D4A020',
        icon: '#B8820A',
        tabIconDefault: '#B8820A80',
        tabIconSelected: '#D4A020',
        border: 'rgba(200,146,10,0.18)',
    },
    // Luminous Gold Sanctuary tokens
    sanctuary: {
        bg: '#FFFBF0',           // Warm Ivory
        surface: 'rgba(255,251,240,0.55)', // Glass surface
        surfaceSolid: '#FFF8E8', // Opaque surface fallback
        gold: '#D4A020',         // Primary Gold
        goldDeep: '#B8820A',     // Deep Gold
        glow: '#FFD060',         // Glow / highlights
        text: '#1A1000',         // Deep Bronze
        textMuted: '#5C4A1E',    // Muted bronze for subtitles
        textLight: '#8B7340',    // Light bronze for placeholders
        border: 'rgba(200,146,10,0.18)',
        aura: '#FFE8A0',         // Soft golden aura
        error: '#8B1A1A',        // Deep crimson
        success: '#1A5C2D',      // Deep emerald
    },
    earth: {
        100: '#FFFBF0',
        200: '#FFF5DE',
        300: '#FFE8A0',
        400: '#FFD060',
        500: '#D4A020',
        600: '#B8820A',
        700: '#8B6208',
        800: '#5C4A1E',
        900: '#1A1000',
    },
};
