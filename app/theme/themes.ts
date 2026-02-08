export const THEMES = [
  {
    id: "tuva-light",
    label: "Tuva Light",
    description: "Bright, clean canvas for focused learning.",
  },
  {
    id: "tokyo",
    label: "Tokyo Night",
    description: "Deep navy with neon cyan accents.",
  },
  {
    id: "dracula",
    label: "Dracula",
    description: "Inky purples with vibrant magenta.",
  },
  {
    id: "nord",
    label: "Nord",
    description: "Cool arctic blues with calm contrast.",
  },
  {
    id: "light",
    label: "Solarized Light",
    description: "Warm paper tones with teal accents.",
  },
] as const;

export type ThemeKey = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeKey = "tuva-light";
