export type ImgFetchPriority = 'high' | 'low' | 'auto';

/**
 * React 18 warns when `fetchPriority` is passed through to DOM `<img>`; the HTML
 * attribute is `fetchpriority` (lowercase).
 */
export function imgFetchPriorityProps(
  priority: ImgFetchPriority | undefined
): { fetchpriority: ImgFetchPriority } | Record<string, never> {
  if (priority === undefined) return {};
  return { fetchpriority: priority };
}
