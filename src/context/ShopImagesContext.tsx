import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getPeptideDisplayImage,
  hasVariantSpecificImage,
  type Peptide,
  type LibraryTheme,
  allPeptides,
} from '../data/peptides';
import {
  fetchShopPrimaryImageOverrides,
  fetchProductSaleInfo,
  fetchLiveProductCatalog,
} from '../services/supabaseService';
import { CFG_CODE_TO_PEPTIDE_ID, PEPTIDE_ID_TO_CFG } from '../data/productMappings';

type SaleInfo = { compareAtPrice: number; saleLabel: string | null };
type LiveProductInfo = { price: number; isActive: boolean; name: string; stockQuantity: number };

type ShopImagesContextValue = {
  loading: boolean;
  /** Resolved hero/card image: Supabase override when present, otherwise static catalogue. */
  resolveDisplayImage: (
    peptideId: string,
    variantId: string | undefined,
    staticFallbackUrl: string
  ) => string;
  /** Resolve sale info for a given peptide, or null if not on sale. */
  resolveSaleInfo: (peptideId: string) => SaleInfo | null;
  /** Check if a product is active in the database (defaults true if not found). */
  isProductActive: (peptideId: string) => boolean;
  /** Get live DB price for a product, or null if not available. */
  getDbPrice: (peptideId: string) => number | null;
  /** All products: static catalog merged with DB-only products created via admin. */
  allProducts: Peptide[];
};

const ShopImagesContext = createContext<ShopImagesContextValue | null>(null);

export function ShopImagesProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [overrideByPeptideId, setOverrideByPeptideId] = useState<
    Record<string, string>
  >({});
  const [saleInfoMap, setSaleInfoMap] = useState<Record<string, SaleInfo>>({});
  const [liveProductMap, setLiveProductMap] = useState<Record<string, LiveProductInfo>>({});
  const [dbOnlyProducts, setDbOnlyProducts] = useState<Peptide[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [imageMap, saleByCfg, catalogByCfg] = await Promise.all([
          fetchShopPrimaryImageOverrides(),
          fetchProductSaleInfo(),
          fetchLiveProductCatalog(),
        ]);
        if (!cancelled) {
          setOverrideByPeptideId(imageMap);

          // Map CFG-code-keyed sale data to peptide IDs
          const mappedSale: Record<string, SaleInfo> = {};
          for (const [cfgCode, info] of Object.entries(saleByCfg)) {
            const pid = CFG_CODE_TO_PEPTIDE_ID[cfgCode];
            if (pid) mappedSale[pid] = info;
          }
          setSaleInfoMap(mappedSale);

          // Map CFG-code-keyed live product data to peptide IDs
          const mappedLive: Record<string, LiveProductInfo> = {};
          const staticPeptideIds = new Set(allPeptides.map((p) => p.id));
          const knownCfgCodes = new Set(Object.values(PEPTIDE_ID_TO_CFG));
          const newDbProducts: Peptide[] = [];

          for (const [cfgCode, info] of Object.entries(catalogByCfg)) {
            const pid = CFG_CODE_TO_PEPTIDE_ID[cfgCode];
            if (pid) {
              mappedLive[pid] = info;
            } else if (!knownCfgCodes.has(cfgCode) && info.isActive) {
              // DB-only product — not in static catalog. Create a Peptide entry.
              const syntheticId = cfgCode.toLowerCase();
              if (!staticPeptideIds.has(syntheticId)) {
                const primaryImage = imageMap[syntheticId] ?? '/images/products/purity.png';
                newDbProducts.push({
                  id: syntheticId,
                  name: info.name,
                  category: 'Healing' as LibraryTheme,
                  libraryFilters: ['Healing'] as LibraryTheme[],
                  purity: '99%+',
                  coaVerified: false,
                  image: primaryImage,
                });
                mappedLive[syntheticId] = info;
              }
            }
          }
          setLiveProductMap(mappedLive);
          setDbOnlyProducts(newDbProducts);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveDisplayImage = useCallback(
    (
      peptideId: string,
      variantId: string | undefined,
      staticFallbackUrl: string
    ) => {
      // Per-variant artwork (e.g. Retatrutide 10/20/30 mg) wins over a generic
      // admin-uploaded "primary" image keyed only by peptideId — otherwise a single
      // upload would replace every strength's hero with the same picture.
      if (hasVariantSpecificImage(peptideId, variantId)) {
        return getPeptideDisplayImage(peptideId, variantId, staticFallbackUrl);
      }
      const o = overrideByPeptideId[peptideId];
      if (o) return o;
      return getPeptideDisplayImage(peptideId, variantId, staticFallbackUrl);
    },
    [overrideByPeptideId]
  );

  const resolveSaleInfo = useCallback(
    (peptideId: string): SaleInfo | null => saleInfoMap[peptideId] ?? null,
    [saleInfoMap]
  );

  const isProductActive = useCallback(
    (peptideId: string): boolean => {
      const info = liveProductMap[peptideId];
      // Default to true if not found in DB (fallback to static catalog)
      return info ? info.isActive : true;
    },
    [liveProductMap]
  );

  const getDbPrice = useCallback(
    (peptideId: string): number | null => {
      const info = liveProductMap[peptideId];
      return info ? info.price : null;
    },
    [liveProductMap]
  );

  const mergedAllProducts = useMemo(
    () => [...allPeptides, ...dbOnlyProducts],
    [dbOnlyProducts]
  );

  const value = useMemo(
    (): ShopImagesContextValue => ({
      loading,
      resolveDisplayImage,
      resolveSaleInfo,
      isProductActive,
      getDbPrice,
      allProducts: mergedAllProducts,
    }),
    [loading, resolveDisplayImage, resolveSaleInfo, isProductActive, getDbPrice, mergedAllProducts]
  );

  return (
    <ShopImagesContext.Provider value={value}>
      {children}
    </ShopImagesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShopImages(): ShopImagesContextValue {
  const ctx = useContext(ShopImagesContext);
  if (!ctx) {
    throw new Error('useShopImages must be used within ShopImagesProvider');
  }
  return ctx;
}
