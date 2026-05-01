/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 - Seoul Education Hub Palette
        md: {
          primary: "#006494", // Trustworthy Blue
          "on-primary": "#FFFFFF",
          "primary-container": "#CBE6FF",
          "on-primary-container": "#001E30",
          secondary: "#50606E",
          "on-secondary": "#FFFFFF",
          "secondary-container": "#D3E5F5",
          "on-secondary-container": "#0C1D29",
          tertiary: "#65587E", // Soft Purple (Stitch accent)
          "on-tertiary": "#FFFFFF",
          surface: "#F8F9FF",
          "on-surface": "#191C1E",
          "surface-variant": "#DEE3EB",
          "on-surface-variant": "#42474E",
          outline: "#72777F",
        },
        stitch: {
          glass: "rgba(255, 255, 255, 0.4)",
          "glass-dark": "rgba(0, 0, 0, 0.4)",
          accent: "#FF4081",
        }
      },
      borderRadius: {
        "md-full": "28px", // Material 3 Extra Large
        "md-lg": "16px",
      },
      boxShadow: {
        "md-1": "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
        "md-2": "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)",
        "stitch-soft": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
