// GitHub Pages serves project sites under /<repo>/ — all raw asset paths must
// be prefixed. BASE is "" in local dev and Vercel, "/protein-for-pennies" on Pages.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(path: string): string {
  return `${BASE}${path}`;
}
