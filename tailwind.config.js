/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primaryBlack: '#000000',
        nearBlack: '#0A0A0A',
        darkGrey: '#1A1A1A',
        borderGrey: '#2A2A2A',
        mediumGrey: '#3A3A3A',
        primaryOrange: '#FF6B35',
        orangeHover: '#FF8C42',
        orangeBright: '#FFA500',
        orangeLight: '#FFB366',
        offWhite: '#F5F5F5',
        lightGrey: '#A0A0A0',
        muted: '#666666',
        secondaryText: '#888888',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale': 'scale 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scale: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      }
    },
  },
  plugins: [
    '@tailwindcss/forms',
  ],
}