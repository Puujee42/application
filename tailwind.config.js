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
            // Divine Yellow Heavenly Palette
            sanctuary: {
                bg: '#FFFFFF', // Pure white background
                surface: 'rgba(255,255,255,0.85)',
                'surface-solid': '#FCF5DF', // Soft warm white
                gold: '#FACC15', // Divine Yellow
                'gold-deep': '#EAB308', // Deeper Yellow
                glow: '#FEF08A',
                text: '#332900',
                'text-muted': '#715A00',
                'text-light': '#A18200',
                border: 'rgba(250,204,21,0.2)', // Soft yellow border
                aura: '#FEF9C3',
                error: '#FB7185',
                success: '#34D399',
            },
            // Backward-compat aliases (monk → sanctuary)
            monk: {
                primary: '#FACC15',
                secondary: '#715A00',
                accent: '#FEF08A',
                bg: '#FFFFFF',
                text: '#332900',
                surface: '#FFFFFF',
                glass: 'rgba(255,255,255,0.85)',
                'surface-highlight': '#FEF9C3',
                'deep-red': '#FB7185',
                gold: '#FACC15',
                'dark-surface': '#FCF5DF',
                'dark-bg': '#FFFFFF',
                aura: '#FEF9C3',
            },
            earth: {
                // Divine Yellow progression
                100: '#FFFFFF',
                200: '#FFFCF5',
                300: '#FCF5DF',
                400: '#FEF9C3',
                500: '#FEF08A',
                600: '#FDE047',
                700: '#FACC15',
                800: '#EAB308',
                900: '#CA8A04',
            },
            white: '#FFFFFF',
            black: '#000000',
            transparent: 'transparent',
        },
    },
    plugins: [],
};
