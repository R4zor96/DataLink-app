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
        'brand-dark': '#1E293B',
        // Paleta Material (ejemplos)
        'primary': { // Azul principal
          light: '#64b5f6',
          DEFAULT: '#2196f3',
          dark: '#1976d2',
        },
        'secondary': { // Gris para texto secundario, bordes
           light: '#e0e0e0',
           DEFAULT: '#9e9e9e',
           dark: '#616161',
        },
        'background': { // Fondos
           DEFAULT: '#f5f5f5', // Gris claro para el fondo general
           paper: '#ffffff',   // Blanco para tarjetas
        }
      }
    },
  },
  plugins: [],
};
