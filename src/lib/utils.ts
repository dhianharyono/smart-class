import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isRedirectError(error: any): boolean {
  return (
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT')
  );
}

/**
 * Escapes special regex characters in user input strings before passing to RegExp or $regex queries.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes cell values to prevent CSV / Formula Injection in Excel exports.
 */
export function sanitizeExcelCell(value: any): any {
  if (typeof value === 'string' && /^[=+@-]/ .test(value.trim())) {
    return `'${value}`;
  }
  return value;
}

