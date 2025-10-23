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
        'brand-dark': '#1E293B', // Color para el sidebar oscuro
        // Colores Material (los mantenemos para el contenido)
        'primary': {
          light: '#64b5f6',
          DEFAULT: '#2196f3',
          dark: '#1976d2',
        },
        'secondary': {
           light: '#e0e0e0',
           DEFAULT: '#9e9e9e',
           dark: '#616161',
        },
        'background': {
           DEFAULT: '#f5f5f5', // Fondo general claro
           paper: '#ffffff',   // Fondo de tarjetas blanco
        }
      }
    },
  },
  plugins: [],
};
