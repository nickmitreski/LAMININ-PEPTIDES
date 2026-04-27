import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import Section from '../layout/Section';
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
      background="neutral"
      spacing="lg"
      id="promo-video"
      className="relative"
    >
      <div
        ref={sectionRef}
        data-revealed={revealed}
        className="reveal mx-auto max-w-5xl"
      >
        <div className="group relative overflow-hidden rounded-2xl border border-carbon-200 bg-carbon-900 shadow-xl">
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
        </div>
      </div>
    </Section>
  );
}
