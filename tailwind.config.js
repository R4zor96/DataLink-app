/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#E71D36',
        'brand-red-dark': '#C2172D',
        'brand-dark': '#1E293B', // Un azul/gris oscuro para fondos y texto
      }
    },
  },
  plugins: [],
};
