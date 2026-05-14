/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0d',
        surface: '#161616',
        raised: '#1c1c1c',
        border: '#2a2a2a',
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", 'monospace'],
      },
    },
  },
  plugins: [],
}

