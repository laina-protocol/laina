/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    colors: {
      white: '#fff',
      grey: {
        DEFAULT: '#999',
        light: '#efefef',
      },
      black: '#000',
    },
    extend: {
      spacing: {
        128: '32rem',
        256: '64rem',
      },
    },
  },
  plugins: [],
};
