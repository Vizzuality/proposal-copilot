/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
module.exports = {
  content: ["./templates/**/*.html", "./static/**/*.js"],
  theme: {
    colors: {
      ...colors,
      vizzuality: "#2ba4a0",
    },
    extend: {
      fontFamily: {
        sans: ["inter", "sans-serif"],
      },
      textColor: {
        vizzuality: "#2ba4a0",
      },
      backgroundColor: {
        vizzuality: "#2ba4a0",
      },
    },
  },
  variants: {
    extend: {
      display: ["group-hover"],
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
