import { describe, expect, it } from 'vitest';
import { buildOptimizedSources } from './optimizedImage';

describe('buildOptimizedSources', () => {
  it('returns null for URLs outside /images/products/', () => {
    expect(buildOptimizedSources('/foo/bar.png')).toBeNull();
    expect(buildOptimizedSources('https://supabase.co/storage/x.png')).toBeNull();
    expect(buildOptimizedSources('/images/coa/cert.pdf')).toBeNull();
  });

  it('returns null for non-PNG product images', () => {
    expect(buildOptimizedSources('/images/products/foo.jpg')).toBeNull();
    expect(buildOptimizedSources('/images/products/foo.webp')).toBeNull();
  });

  it('builds AVIF/WebP/PNG srcsets at 400/800/1200 widths', () => {
    const result = buildOptimizedSources('/images/products/foo.png');
    expect(result).not.toBeNull();
    expect(result!.avifSrcSet).toBe(
      '/images/products/optimized/foo-400w.avif 400w, /images/products/optimized/foo-800w.avif 800w, /images/products/optimized/foo-1200w.avif 1200w'
    );
    expect(result!.webpSrcSet).toContain('-400w.webp 400w');
    expect(result!.webpSrcSet).toContain('-1200w.webp 1200w');
    expect(result!.pngSrcSet).toContain('-800w.png 800w');
  });

  it('preserves URL-encoded spaces, em-dashes, parentheses in filenames', () => {
    const enc =
      '/images/products/CFG-001_119%20%E2%80%94%20CJC-1295%20(no%20DAC)%2010mg.png';
    const result = buildOptimizedSources(enc);
    expect(result).not.toBeNull();
    // The optimised path must round-trip the encoding so the request matches
    // the actual file on disk (which is named with literal spaces/em-dash).
    expect(result!.avifSrcSet).toContain('CFG-001_119%20%E2%80%94%20CJC-1295%20(no%20DAC)%2010mg-400w.avif');
    expect(result!.fallbackSrc).toBe(
      '/images/products/optimized/CFG-001_119%20%E2%80%94%20CJC-1295%20(no%20DAC)%2010mg-1200w.png'
    );
  });

  it('accepts uppercase PNG extension', () => {
    expect(buildOptimizedSources('/images/products/FOO.PNG')).not.toBeNull();
  });
});
