/** Merge class names (shadcn-style helper; no extra deps). */
export function cn(
  ...inputs: (string | undefined | null | false)[]
): string {
  return inputs.filter(Boolean).join(' ');
}
