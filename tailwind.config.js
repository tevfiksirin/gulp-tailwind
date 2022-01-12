module.exports = {
  content: ['./src/**/*.html'],
  theme: {
    extend: {}
  },
  variants: {},
  plugins: [],
  presets: [
    require('tailwindcss/defaultConfig'), require('xtendui/tailwind.preset'),
  ],
  // put other purge content e.g.: './src/**/*.{html,js}'
  content: ['./node_modules/xtendui/src/*[!.css].js'],
};
