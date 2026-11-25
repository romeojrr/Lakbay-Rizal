/** Builds a URL for a file in public/ that respects Vite's base path (e.g. GitHub Pages). */
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
