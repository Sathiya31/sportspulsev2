// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},  // ✅ new official plugin for Tailwind v4
    autoprefixer: {},
  },
};

export default config;
