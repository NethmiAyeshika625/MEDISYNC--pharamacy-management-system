/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#051018',
          900: '#0b1720',
          800: '#132430'
        },
        teal: {
          400: '#5eead4',
          500: '#2dd4bf',
          600: '#0f766e'
        },
        sand: {
          50: '#f8fafc',
          100: '#e2e8f0'
        }
      },
      boxShadow: {
        glow: '0 20px 60px rgba(45, 212, 191, 0.18)'
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top left, rgba(45,212,191,0.25), transparent 35%), radial-gradient(circle at bottom right, rgba(59,130,246,0.18), transparent 30%)'
      }
    }
  },
  plugins: []
};
