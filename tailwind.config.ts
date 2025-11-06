import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calixo brand colors
        beige: {
          DEFAULT: '#F5F0E8',
          light: '#FAF7F2',
          dark: '#E8E3DB',
        },
        'soft-blue': {
          DEFAULT: '#5A8DEE',
          light: '#7BA5F4',
          dark: '#4374D9',
        },
        'neutral-gray': {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
          dark: '#4B5563',
        },
        'accent-green': {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
        },
        'accent-red': {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        'dark-navy': {
          DEFAULT: '#1E293B',
          light: '#334155',
          dark: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;

