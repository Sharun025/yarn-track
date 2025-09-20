import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buildIlikePattern = (value: string) => {
  const sanitized = value.replace(/[%_,]/g, (char) => `\\${char}`)
  return `%${sanitized}%`
}
