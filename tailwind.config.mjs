/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      sans: ['Manrope', 'system-ui', 'sans-serif'],
    },
    colors: {
      white: '#fff',
      grey: {
        dark: '#555',
        DEFAULT: '#999',
        light: '#efefef',
      },
      black: '#000',
      primary: '#000',
    },
    fontSize: {
      sm: ['14px', '20px'],
      base: ['18px', '24px'],
      lg: ['20px', '28px'],
      xl: ['26px', '32px'],
      '2xl': ['32px', '40px'],
      '3xl': ['48px', '56px'],
    },
    borderRadius: {
      none: '0',
      DEFAULT: '16px',
      full: '9999px',
    },
    dropShadow: {
      DEFAULT: '0 4px 4px rgba(0, 0, 0, 0.25)',
    },
    extend: {
      spacing: {
        128: '32rem',
        256: '64rem',
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          neutral: '#000',
          '.btn-neutral:hover': {
            'background-color': '#555',
          },
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
