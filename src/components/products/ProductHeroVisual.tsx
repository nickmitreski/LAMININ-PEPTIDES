/**
 * PDP hero — catalogue vial render from /images/products/ (peptide.image).
 * For better LCP on slow networks, add optional `.webp` alongside PNG and use `<picture>` + `srcset`
 * (no WebP is bundled here so filenames stay predictable for static hosting).
 */
import ShopProductImage from '../ui/ShopProductImage';

interface ProductHeroVisualProps {
  imageSrc: string;
  productName: string;
}

export default function ProductHeroVisual({
  imageSrc,
  productName,
}: ProductHeroVisualProps) {
  return (
    <div className="flex min-h-0 w-full min-w-0 justify-center lg:justify-end lg:pe-2 xl:pe-6">
      <div className="relative flex w-full max-w-[17.5rem] items-center justify-center sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
        {/* Soft ambient backdrop — pure decoration. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-accent/10 via-transparent to-platinum/40 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl"
        />
        <ShopProductImage
          src={imageSrc}
          alt={`${productName} — laboratory vial`}
          className="relative block w-full"
          imgClassName="h-auto w-full max-h-[min(28rem,58vh)] object-contain object-center drop-shadow-[0_24px_40px_rgba(15,15,15,0.08)] transition-transform duration-500 ease-out motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
