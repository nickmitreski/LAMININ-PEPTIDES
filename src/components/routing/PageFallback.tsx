/**
 * Shown while lazy route chunks load. Keep markup minimal so it stays in the entry bundle.
 */
export default function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-platinum">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent motion-reduce:animate-none motion-reduce:border-carbon-900/30"
        aria-hidden
      />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
