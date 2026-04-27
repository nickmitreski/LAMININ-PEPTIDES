import { useEffect, useRef, useState } from 'react';
import { Play, ShieldCheck, FlaskConical, FileCheck2 } from 'lucide-react';
import Section from '../layout/Section';
import { Heading, Label, Text } from '../ui/Typography';
import useScrollReveal from '../../hooks/useScrollReveal';

/**
 * Poster image used until a real promo video / cover asset replaces it.
 * Pulls from the existing brand imagery so the section never looks empty.
 */
const POSTER_SRC = '/images/products/glow-70mg.png';

/**
 * If/when a promo video file is dropped into /public, set its path here and the
 * placeholder converts into an HTML5 <video> player automatically.
 */
const VIDEO_SRC: string | null = null;

const highlights = [
  {
    icon: ShieldCheck,
    title: '99%+ verified purity',
    body: 'Every batch tested before it ships.',
  },
  {
    icon: FlaskConical,
    title: 'Independent analysis',
    body: 'Mass spec + HPLC reports for every compound.',
  },
  {
    icon: FileCheck2,
    title: 'Open documentation',
    body: 'Certificates of Analysis available on request.',
  },
];

export default function PromoVideo() {
  const { ref: sectionRef, revealed } = useScrollReveal<HTMLDivElement>();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Pause the player automatically when the section scrolls offscreen.
  useEffect(() => {
    if (!videoRef.current) return;
    if (!revealed && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [revealed, isPlaying]);

  const handlePlay = () => {
    if (!VIDEO_SRC || !videoRef.current) {
      // No video wired yet — flag the intent visually but don't break.
      setIsPlaying(true);
      return;
    }
    videoRef.current.play().catch(() => {
      // Autoplay blocked or asset missing; surface controls instead.
    });
    setIsPlaying(true);
  };

  return (
    <Section
      background="dark"
      spacing="lg"
      id="promo-video"
      aria-labelledby="promo-video-heading"
      className="relative overflow-hidden"
    >
      {/* Ambient gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
      >
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div
        ref={sectionRef}
        data-revealed={revealed}
        className="reveal relative z-10 mx-auto max-w-3xl text-center"
      >
        <Label className="mb-4 inline-block text-accent">Watch the lab</Label>
        <Heading
          level={2}
          id="promo-video-heading"
          className="mb-5 text-white"
        >
          Inside the process behind every vial
        </Heading>
        <Text variant="lead" weight="light" className="text-white/70">
          A short look at how Laminin Peptide Lab sources, tests, and documents
          research-grade peptides — from synthesis to certificate of analysis.
        </Text>
      </div>

      <div
        data-revealed={revealed}
        className="reveal reveal-delay-1 relative z-10 mx-auto mt-12 max-w-5xl"
      >
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-carbon-800 shadow-2xl ring-1 ring-white/5">
          {/* Aspect ratio frame */}
          <div className="relative aspect-video w-full">
            {VIDEO_SRC ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                poster={POSTER_SRC}
                controls={isPlaying}
                preload="metadata"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
            ) : (
              <>
                <img
                  src={POSTER_SRC}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover opacity-50"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-br from-carbon-900/80 via-carbon-900/40 to-accent/30"
                />
              </>
            )}

            {/* Play overlay */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlay}
                aria-label="Play promo video"
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-carbon-900"
              >
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-carbon-900 shadow-xl transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-accent/40 motion-safe:animate-ping"
                  />
                  <Play
                    className="relative h-7 w-7 translate-x-0.5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </span>
                <span className="rounded-full border border-white/30 bg-black/40 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
                  {VIDEO_SRC ? 'Play promo' : 'Promo video coming soon'}
                </span>
              </button>
            )}
          </div>

          {/* Bottom highlight strip */}
          <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 bg-carbon-900/60 backdrop-blur-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-3 px-5 py-4 sm:py-5"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-white/60">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
