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
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }