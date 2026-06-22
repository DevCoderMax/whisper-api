import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

const STORAGE_KEY = "whisper-api.theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Default inicial: dark (pessoas que abrem apps de transcrição tendem a trabalhar em ambientes escuros)
  return "dark";
}

function applyToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = readInitial();
  // Aplica no carregamento
  queueMicrotask(() => applyToDocument(initial));

  return {
    theme: initial,
    set: (t) => {
      applyToDocument(t);
      window.localStorage.setItem(STORAGE_KEY, t);
      set({ theme: t });
    },
    toggle: () => {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      applyToDocument(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      set({ theme: next });
    },
  };
});
