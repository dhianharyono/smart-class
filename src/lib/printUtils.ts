export type PrintOrientation = 'landscape' | 'portrait';

export const PRINT_ORIENTATION_STORAGE_KEY = 'smart_class_print_orientation';

export function getSavedPrintOrientation(
  fallback: PrintOrientation = 'landscape',
): PrintOrientation {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(PRINT_ORIENTATION_STORAGE_KEY);
    if (saved === 'landscape' || saved === 'portrait') {
      return saved;
    }
  } catch {
    // Fallback if storage access is restricted
  }
  return fallback;
}

export function savePrintOrientation(orientation: PrintOrientation): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRINT_ORIENTATION_STORAGE_KEY, orientation);
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Triggers native browser print directly.
 * By keeping @page without a hardcoded size/orientation rule,
 * Chromium and modern browsers automatically display the native
 * "Layout: [ Portrait | Landscape ]" dropdown directly in the print dialog.
 */
export function triggerPrint(_orientation?: PrintOrientation) {
  if (typeof window === 'undefined') return;

  // Clean up any previously injected dynamic styles that may have set @page size
  const existingStyle = document.getElementById('smart-class-print-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Trigger native browser print dialog
  window.print();
}
