/** Resolve shared CSS tokens for canvas and Three.js materials. */
export const designColor = (token: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
