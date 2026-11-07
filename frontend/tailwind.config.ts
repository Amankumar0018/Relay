import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          DEFAULT: "#171717",
          surface: "#1F1F1F",
          muted: "#2C2C2C",
        },
        "raw-paper": {
          DEFAULT: "#EAE5D8",
          light: "#F4F1E8",
          dark: "#DDD7C6",
        },
        "signal-orange": {
          DEFAULT: "#F15A24",
          hover: "#D94713",
          light: "#FDF0EA",
        },
        "signal-red": {
          DEFAULT: "#D32F2F",
          light: "#FFEBEE",
        },
        concrete: {
          DEFAULT: "#D5CEBD",
          light: "#E1DBD0",
          dark: "#B8B09E",
        },
        "industrial-green": {
          DEFAULT: "#353C35",
          light: "#E5E9E5",
          border: "#4E574E",
        },
        "signal-yellow": {
          DEFAULT: "#F0C94A",
          light: "#FDF9EB",
        },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "Archivo", "Impact", "sans-serif"],
        sans: ["var(--font-ibm-plex-sans)", "IBM Plex Sans", "-apple-system", "sans-serif"],
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },
      boxShadow: {
        brutal: "2px 2px 0px #171717",
        "brutal-lg": "4px 4px 0px #171717",
        "brutal-orange": "2px 2px 0px #F15A24",
        "brutal-concrete": "2px 2px 0px #D5CEBD",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
