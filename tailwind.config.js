/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      './pages/**/*.{ts,tsx,js,jsx}',
      './components/**/*.{ts,tsx,js,jsx}',
      './app/**/*.{ts,tsx,js,jsx}',
      './src/**/*.{ts,tsx,js,jsx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        },
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          // ... other shadcn/ui color configurations

          // Ignition brand palette — mirrors the marketing site (navy + orange).
          navy: {
            50: "#EEF1FB",
            100: "#D9DFF5",
            200: "#B3C0EC",
            300: "#8DA0E2",
            400: "#5A72C9",
            500: "#34449E",
            600: "#23307B",
            700: "#182463",
            800: "#101A4C",
            900: "#0B1345",
            950: "#060A28",
            DEFAULT: "#0B1345",
          },
          ignite: {
            50: "#FFF4ED",
            100: "#FFE4D2",
            200: "#FFC5A3",
            300: "#FFA36E",
            400: "#FF7A3D",
            500: "#FF5A1F",
            600: "#F04600",
            700: "#C93900",
            800: "#9E2D00",
            900: "#7A2400",
            DEFAULT: "#FF5A1F",
          },
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }