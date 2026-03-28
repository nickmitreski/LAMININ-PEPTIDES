/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary color - Pure Black
        carbon: {
          DEFAULT: '#000000',
          950: '#000000',
          900: '#000000',
          800: '#1a1a1a',
          700: '#333333',
          600: '#4d4d4d',
          500: '#666666',
        },

        // Neutral greys for backgrounds and muted text
        neutral: {
          50:  '#F7F7F7',
          100: '#EDEDEE',
          200: '#DDDEDE',
          300: '#CBCCCC',
          400: '#A3A4A4',
          500: '#7A7B7B',
          600: '#5A5B5B',
          700: '#3D3E3E',
          800: '#272828',
          900: '#1A1B1B',
        },

        // Brand accent - Aqua/Teal
        accent: {
          DEFAULT: '#89D1D1',
          light:   '#A5DEDE',
          dark:    '#6BBFBF',
          muted:   '#E8F5F5',
        },

        // Blue for toggle tabs
        blue: {
          DEFAULT: '#3B82F6',
          light:   '#60A5FA',
          dark:    '#2563EB',
        },

        // Page backgrounds
        grey: '#F1F2F2',
        platinum: '#F1F2F2',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.75rem',   { lineHeight: '1.5',  letterSpacing: '0.02em' }],
        'sm':   ['0.8125rem', { lineHeight: '1.5',  letterSpacing: '0.01em' }],
        'base': ['1rem',      { lineHeight: '1.65', letterSpacing: '0' }],
        'lg':   ['1.125rem',  { lineHeight: '1.6',  letterSpacing: '0' }],
        'xl':   ['1.25rem',   { lineHeight: '1.5',  letterSpacing: '0' }],
        '2xl':  ['1.5rem',    { lineHeight: '1.35', letterSpacing: '0' }],
        '3xl':  ['1.875rem',  { lineHeight: '1.25', letterSpacing: '0' }],
        '4xl':  ['2.25rem',   { lineHeight: '1.15', letterSpacing: '0' }],
        '5xl':  ['3rem',      { lineHeight: '1.1',  letterSpacing: '0' }],
        '6xl':  ['3.75rem',   { lineHeight: '1.05', letterSpacing: '0' }],
        '7xl':  ['4.5rem',    { lineHeight: '1.0',  letterSpacing: '0' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      letterSpacing: {
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        luxury: '0.2em',
        hero: '0.25em',
        button: '0.06em',
      },
      borderRadius: {
        none: '0',
        xs: '0.125rem',
        sm: '0.1875rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.5rem',
        '2xl': '0.625rem',
        full: '9999px',
      },
      maxWidth: {
        'prose': '65ch',
        'content': '1600px',
      },
      boxShadow: {
        'sm':      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'md':      '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'lg':      '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'xl':      '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'subtle':  '0 0 0 1px rgba(0, 0, 0, 0.06)',
        'none':    'none',
      },
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};
