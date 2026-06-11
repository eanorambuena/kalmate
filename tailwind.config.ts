import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        bloomberg: {
          bg: '#0a0a0a',
          surface: '#111',
          border: '#2a2a2a',
          green: '#00c853',
          red: '#ff1744',
          blue: '#2979ff',
          yellow: '#ffd600',
        },
      },
      fontFamily: {
        mono: ['SF Mono', 'Consolas', 'Monaco', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
}
