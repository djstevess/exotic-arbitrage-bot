/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for arbitrage bot
        profit: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        loss: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        chain: {
          ethereum: '#627eea',
          arbitrum: '#28a0f0',
          solana: '#14f195',
          avalanche: '#e84142',
          cosmos: '#2e3148',
          fantom: '#1969ff',
          blast: '#fcfc03',
          base: '#0052ff',
          optimism: '#ff0420',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // Add custom utilities for arbitrage-specific styling
    function({ addUtilities }) {
      const newUtilities = {
        '.text-profit': {
          color: '#22c55e',
          fontWeight: '600',
        },
        '.text-loss': {
          color: '#ef4444',
          fontWeight: '600',
        },
        '.bg-chain-gradient': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        '.shadow-glow': {
          boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
        },
        '.border-glow': {
          borderColor: '#22c55e',
          boxShadow: '0 0 0 1px #22c55e',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};