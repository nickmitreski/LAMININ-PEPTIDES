import { useState } from 'react';
import Button from '../ui/Button';

type AgeChoice = 'unset' | 'minor' | 'adult';

const legalLinkClass =
  'text-xs font-medium uppercase tracking-wide text-accent underline decoration-accent/50 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60';

export default function EntryScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [age, setAge] = useState<AgeChoice>('unset');
  const [termsRead, setTermsRead] = useState(false);

  const canContinue = age === 'adult' && termsRead;

  return (
    <div className="min-h-screen bg-carbon-900 pb-safe pt-safe text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <header className="shrink-0 text-center">
          <img
            src="/images/brand/logo-white.png"
            alt="Laminin Peptide Lab"
            className="mx-auto h-14 w-auto sm:h-[4.25rem] md:h-[4.75rem]"
          />
        </header>

        {/* Age */}
        <section className="mt-8 shrink-0 sm:mt-10" aria-labelledby="age-heading">
          <h2
            id="age-heading"
            className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
          >
            Age confirmation
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAge('adult')}
              className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide transition-colors touch-manipulation ${
                age === 'adult'
                  ? 'border-accent bg-accent text-carbon-900'
                  : 'border-white/20 bg-white/5 text-white hover:border-white/35'
              }`}
            >
              I am 18 or over
            </button>
            <button
              type="button"
              onClick={() => {
                setAge('minor');
                setTermsRead(false);
              }}
              className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide transition-colors touch-manipulation ${
                age === 'minor'
                  ? 'border-white/50 bg-white/15 text-white'
                  : 'border-white/20 bg-white/5 text-white hover:border-white/35'
              }`}
            >
              I am under 18
            </button>
          </div>
        </section>

        {age === 'adult' && (
          <label className="mt-5 flex shrink-0 cursor-pointer gap-3 rounded-lg border border-white/15 bg-white/5 p-4 touch-manipulation sm:mt-6">
            <input
              type="checkbox"
              checked={termsRead}
              onChange={(e) => setTermsRead(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-carbon-900 text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-carbon-900"
            />
            <span className="text-sm leading-snug text-white/90">
              I confirm I have read and agree to the{' '}
              <a
                href="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                Terms &amp; Conditions
              </a>
              .
            </span>
          </label>
        )}

        {/* Primary CTA — vertically centred in remaining space */}
        <div className="flex min-h-0 flex-1 flex-col justify-center py-6 sm:py-8">
          <div className="mx-auto w-full max-w-sm">
            <Button
              type="button"
              variant="accent"
              size="lg"
              disabled={!canContinue}
              onClick={onComplete}
              className="w-full uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enter site
            </Button>
          </div>
        </div>

        <div className="shrink-0 space-y-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={legalLinkClass}
            >
              Privacy Policy
            </a>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <a
              href="/guarantee"
              target="_blank"
              rel="noopener noreferrer"
              className={legalLinkClass}
            >
              Purity assurance guarantee
            </a>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <a
              href="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className={legalLinkClass}
            >
              Terms
            </a>
          </div>

          <p className="text-center text-[0.65rem] text-white/40">
            Full legal text opens in a new tab. You must complete this screen to use the store.
          </p>
        </div>
      </div>
    </div>
  );
}
