// FR-62 preview mode: open the site with ?preview=1 to see draft stops in a production build.
// The choice is kept for the browser tab, so it survives moving between pages.
// ?preview=0 turns it off again.
const KEY = 'lakbay-rizal:preview';

export function isPreviewMode(search: string): boolean {
  const param = new URLSearchParams(search).get('preview');
  try {
    if (param === '1') sessionStorage.setItem(KEY, '1');
    if (param === '0') sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    // Storage can be blocked (private mode); fall back to the URL alone.
    return param === '1';
  }
}
