/**
 * Compact CoreForge wordmark for nav / checkout (partner payment disclosure).
 * On dark backgrounds use variant "onDark"; on light cards use "onLight".
 */
export default function CoreForgeMark({
  variant,
  className = '',
}: {
  variant: 'onDark' | 'onLight';
  className?: string;
}) {
  const onDark = variant === 'onDark';
  const core = onDark ? 'text-white' : 'text-carbon-900';
  const sub = onDark ? 'text-white/55' : 'text-neutral-600';

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="CoreForge secure payments"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-red-600 shadow-sm">
        <span className="h-2 w-2 rounded-[1px] bg-white" aria-hidden />
      </span>
      <span className={`flex flex-col leading-none ${sub}`}>
        <span className={`text-[10px] font-medium uppercase tracking-[0.14em] ${sub}`}>
          Secure pay
        </span>
        <span className={`mt-0.5 text-sm font-bold tracking-wide ${core}`}>
          CORE<span className="text-red-600">FORGE</span>
        </span>
      </span>
    </div>
  );
}
