/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    borderRadius: {
      'none': '0px',
      'sm': '5px',
      DEFAULT: '5px',
      'md': '5px',
      'lg': '5px',
      'xl': '5px',
      '2xl': '5px',
      '3xl': '5px',
      'full': '9999px',
    },
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0b1020",
          800: "#101833",
          700: "#16204a",
        },
        paper: "#f7f6f2",
        brand: {
          50: "#e9fff7",
          100: "#c7ffea",
          200: "#86ffd2",
          300: "#2ef7b3",
          400: "#11d593",
          500: "#06b77e",
          600: "#059267",
          700: "#057558",
          800: "#055f49",
          900: "#034d3c",
        },
        plum: {
          400: "#c084fc",
          500: "#a855f7",
        },
      },
      boxShadow: {
        card: "0 24px 80px rgba(11, 16, 32, 0.20)",
        sharp: "6px 6px 0 rgba(11, 16, 32, 0.9)",
      },
    },
  },
  plugins: [],
};
