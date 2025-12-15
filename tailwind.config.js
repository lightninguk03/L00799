/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'void-black': '#050505',
                'lightning-cyan': '#00F3FF',
                'soul-purple': '#BC13FE',
                'voltage-yellow': '#FEE801',
                'flux-white': '#FFFFFF',
                'glass-black': 'rgba(5, 5, 5, 0.6)',
                // Keep existing for compatibility if needed, but prefer new ones
                'neon-purple': '#BC13FE',
                'cyber-cyan': '#00F3FF',
                'deep-space': '#050505',
            },
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                rajdhani: ['Rajdhani', 'sans-serif'], // Added for body text
                sans: ['"Noto Sans SC"', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'cyber-gradient': 'linear-gradient(to right, #BC13FE, #00F3FF)',
                'grid-pattern': "linear-gradient(to right, rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 243, 255, 0.05) 1px, transparent 1px)",
            },
            boxShadow: {
                'neon': '0 0 10px rgba(188, 19, 254, 0.5), 0 0 20px rgba(188, 19, 254, 0.3)',
                'cyan-glow': '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
                'glass-edge': 'inset 0 0 20px rgba(0, 243, 255, 0.1)',
            },
            keyframes: {
                glitch: {
                    '0%, 100%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(2px, -2px)' },
                },
                'scanline': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                'slow-spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'pulse-fast': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
            },
            animation: {
                glitch: 'glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite',
                scanline: 'scanline 8s linear infinite',
                'slow-spin': 'slow-spin 20s linear infinite',
                'pulse-fast': 'pulse-fast 1s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
