
/**
 * Resolves a path relative to the base URL of the application.
 * Useful for assets in the public folder when deploying to sub-paths like GitHub Pages.
 */
export function resolveAsset(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
