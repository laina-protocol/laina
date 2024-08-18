// .prettierrc.mjs
/** @type {import("prettier").Config} */
const config = {
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
  tabWidth: 2,
  useTabs: false,
  printWidth: 120,
  singleQuote: true,
  jsxSingleQuote: false,
  bracketSpacing: true,
  semi: true
}

export default config;
