/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#211C1A",
        coral: "#E96F6B",
        cream: "#F7F3F0",
        muted: "#756E6A",
      },
    },
  },
  plugins: [],
};
