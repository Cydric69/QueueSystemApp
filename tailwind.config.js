/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1E40AF",
          light: "#DBEAFE",
        },
        secondary: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        background: "#F9FAFB",
        card: "#FFFFFF",
        text: {
          DEFAULT: "#111827",
          secondary: "#6B7280",
        },
        border: "#E5E7EB",
      },
    },
  },
  plugins: [],
};
