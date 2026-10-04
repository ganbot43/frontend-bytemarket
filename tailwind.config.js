export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        cp: {
          navy: '#1a2847',
          electric: '#00d4ff',
          'light-navy': '#2c3e50',
          success: '#4caf50',
          warning: '#ff9800',
          danger: '#f44336',
          info: '#2196f3',
          overlay: 'rgba(26, 40, 71, 0.7)',
          border: '#e5e7eb'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'cp-light': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'cp-medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    }
  },
  plugins: [],
}
