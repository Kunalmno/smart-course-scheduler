import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and resolves conflicting Tailwind classes.
 * 
 * @param inputs - Array of class values, objects, or conditional statements.
 * @returns A merged string of deduplicated and conflict-resolved CSS classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}