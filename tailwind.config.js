/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Georgia'],
                sans: ['System'],
            },
        },
        colors: {
            // Luminous Gold Sanctuary Palette
            sanctuary: {
                bg: '#FFFCF2', // Ivory background
                surface: 'rgba(255,252,242,0.55)',
                'surface-solid': '#FFF8E8', // Warm Cream
                gold: '#E8B830', // Bright Gold
                'gold-deep': '#C8960C', // Deep Gold
                glow: '#FFD060',
                text: '#1A1000',
                'text-muted': '#5C4A1E',
                'text-light': '#8B7340',
                border: 'rgba(200,146,10,0.14)', // Subtle amber border
                aura: '#FFE8A0',
                error: '#8B1A1A',
                success: '#1A5C2D',
            },
            // Backward-compat aliases (monk → sanctuary)
            monk: {
                primary: '#D4A020',
                secondary: '#5C4A1E',
                accent: '#FFD060',
                bg: '#FFFBF0',
                text: '#1A1000',
                surface: '#FFF8E8',
                glass: 'rgba(255,251,240,0.55)',
                'surface-highlight': '#FFF5DE',
                'deep-red': '#8B1A1A',
                gold: '#D4A020',
                'dark-surface': '#FFF5DE',
                'dark-bg': '#FFFBF0',
                aura: '#FFE8A0',
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
            white: '#FFFFFF',
            black: '#000000',
            transparent: 'transparent',
        },
    },
    plugins: [],
};
