/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde7c3',
          200: '#fbd495',
          300: '#f9b967',
          400: '#f69a3f',
          500: '#f48020',
          600: '#e36616',
          700: '#b94d12',
          800: '#923e10',
          900: '#77340e'
        }
      }
    }
  },
  plugins: []
}
