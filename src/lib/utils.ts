import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// standard classname smoosher-together-er
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
