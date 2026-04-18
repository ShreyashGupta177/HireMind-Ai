/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-black': '#08070f',
        'dark-purple': '#1a1124',
        'primary-purple': '#a855f7',
        'accent-fuchsia': '#e879f9',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #a855f7 0%, #e879f9 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.3)',
        'glow-fuchsia': '0 0 20px rgba(232, 121, 249, 0.4)',
      },
    },
  },
  plugins: [],
}