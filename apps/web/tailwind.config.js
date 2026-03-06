export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        ink: "var(--text)",
        soft: "var(--text-soft)",
        line: "var(--line)",
        accent: "var(--accent)",
        deep: "var(--accent-deep)",
        panel: "var(--surface-muted)",
      },
      boxShadow: {
        panel: "var(--shadow-lg)",
        soft: "var(--shadow-md)",
      },
      borderRadius: {
        panel: "24px",
      },
    },
  },
  plugins: [],
};
