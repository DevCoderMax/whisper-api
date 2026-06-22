import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do Tailwind de forma inteligente:
 * - `clsx` resolve condicionais
 * - `twMerge` resolve conflitos (ex.: `p-2 p-4` => `p-4`)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
