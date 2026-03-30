export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-carbon-900 focus:font-medium focus:rounded-sm focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-carbon-900 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
