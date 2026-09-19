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
        // Matches the public platform. The stack, not just the family, so a
        // blocked webfont degrades the same way in both halves.
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Ignition's brand palette, the same values as the public platform's
        // tokens in Ignition-Landing/app/globals.css.
        //
        // Additive and non-colliding: the existing screens keep using
        // Tailwind's default greys and shadcn's semantic names untouched. The
        // landing site's `muted`/`muted-light` text colours are exposed here as
        // `ink-muted`/`ink-faint` instead, because `muted` already belongs to
        // shadcn (`bg-muted`, `text-muted-foreground`) and redefining it would
        // restyle components that had nothing to do with this work.
        //
        // `navy` is ONE object. It used to be declared twice in this file — a
        // brand pair `{ DEFAULT, ink }` and, forty lines further down, the
        // 50–950 scale. The second declaration won, so `bg-navy-ink` matched no
        // colour and generated no class: the login and registration button had
        // a hover state that did nothing. The scale is what the app actually
        // uses (`navy-900` alone appears 80-odd times), so it is the one that
        // stayed, with `ink` folded in as the darker press/hover step.
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
          // 900 is the public website's primary navy (`--color-navy` in
          // Ignition-Landing/app/globals.css) and 950/ink its hover step
          // (`--color-navy-ink`), so a button, heading or link in the portal is
          // the same colour as its counterpart on the site. It was #0B1345, a
          // greyer navy that read as a near-miss next to the logo.
          900: "#01166f",
          950: "#020f53",
          ink: "#020f53",
          DEFAULT: "#01166f",
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
        orange: "#fc5a07",
        "blue-link": "#2450dc",
        "blue-bright": "#1071f6",
        canvas: "#fbfafe",
        nav: "#1f2150",
        ink: {
          DEFAULT: "#12162f",
          soft: "#3a3e58",
          muted: "#5f637e",
          faint: "#7c7f9a",
        },
        hairline: "#e7e9f2",
        "ring-idle": "#d4d8e4",

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
      boxShadow: {
        // Soft, two-sided elevation — a light "neumorphic" treatment. Each
        // shadow pairs a navy-tinted drop below with a white highlight above
        // (and a hairline inner top light), so surfaces read as gently raised
        // out of the canvas rather than floating on a hard drop shadow. Kept
        // low-contrast on purpose: depth, not decoration.
        //
        // The Tailwind defaults (`shadow-sm` … `shadow-2xl`) are redefined in
        // the same family so the older screens that still use them match the
        // redesigned ones without being touched.
        card: "inset 0 1px 0 0 rgba(255,255,255,0.8), 0 1px 2px 0 rgba(1,22,111,0.04), 6px 8px 22px -10px rgba(1,22,111,0.14), -6px -6px 16px -10px rgba(255,255,255,0.9)",
        lift: "inset 0 1px 0 0 rgba(255,255,255,0.85), 0 2px 4px 0 rgba(1,22,111,0.05), 10px 14px 30px -12px rgba(1,22,111,0.20), -8px -8px 20px -10px rgba(255,255,255,0.95)",
        float: "0 24px 48px -18px rgba(1,22,111,0.30), 0 6px 16px -6px rgba(1,22,111,0.12)",
        sm: "0 1px 2px 0 rgba(1,22,111,0.05), 3px 4px 10px -6px rgba(1,22,111,0.10), -3px -3px 8px -6px rgba(255,255,255,0.9)",
        DEFAULT: "inset 0 1px 0 0 rgba(255,255,255,0.8), 0 1px 2px 0 rgba(1,22,111,0.04), 6px 8px 22px -10px rgba(1,22,111,0.14), -6px -6px 16px -10px rgba(255,255,255,0.9)",
        md: "inset 0 1px 0 0 rgba(255,255,255,0.8), 0 2px 4px 0 rgba(1,22,111,0.05), 8px 12px 26px -12px rgba(1,22,111,0.18), -6px -6px 18px -10px rgba(255,255,255,0.95)",
        lg: "inset 0 1px 0 0 rgba(255,255,255,0.85), 0 2px 4px 0 rgba(1,22,111,0.05), 10px 14px 30px -12px rgba(1,22,111,0.20), -8px -8px 20px -10px rgba(255,255,255,0.95)",
        xl: "0 20px 40px -16px rgba(1,22,111,0.26), 0 6px 14px -6px rgba(1,22,111,0.10)",
        "2xl": "0 28px 56px -20px rgba(1,22,111,0.32), 0 8px 18px -8px rgba(1,22,111,0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
