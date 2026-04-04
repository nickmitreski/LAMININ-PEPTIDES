/**
 * PDP hero — catalogue vial render from /images/products/ (peptide.image).
 * For better LCP on slow networks, add optional `.webp` alongside PNG and use `<picture>` + `srcset`
 * (no WebP is bundled here so filenames stay predictable for static hosting).
 */
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
      <div className="flex w-full max-w-[17.5rem] items-center justify-center sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
        <img
          src={imageSrc}
          alt={`${productName} — laboratory vial`}
          loading="eager"
          className="h-auto w-full max-h-[min(28rem,58vh)] object-contain object-center"
        />
      </div>
    </div>
  );
}
