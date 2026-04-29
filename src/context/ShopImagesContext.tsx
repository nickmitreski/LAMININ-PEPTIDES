import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPeptideDisplayImage } from '../data/peptides';
import {
  fetchShopPrimaryImageOverrides,
  fetchProductSaleInfo,
  fetchLiveProductCatalog,
} from '../services/supabaseService';
import { CFG_CODE_TO_PEPTIDE_ID } from '../data/productMappings';

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
};

const ShopImagesContext = createContext<ShopImagesContextValue | null>(null);

export function ShopImagesProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [overrideByPeptideId, setOverrideByPeptideId] = useState<
    Record<string, string>
  >({});
  const [saleInfoMap, setSaleInfoMap] = useState<Record<string, SaleInfo>>({});
  const [liveProductMap, setLiveProductMap] = useState<Record<string, LiveProductInfo>>({});

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
          for (const [cfgCode, info] of Object.entries(catalogByCfg)) {
            const pid = CFG_CODE_TO_PEPTIDE_ID[cfgCode];
            if (pid) mappedLive[pid] = info;
          }
          setLiveProductMap(mappedLive);
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

  const value = useMemo(
    (): ShopImagesContextValue => ({
      loading,
      resolveDisplayImage,
      resolveSaleInfo,
      isProductActive,
      getDbPrice,
    }),
    [loading, resolveDisplayImage, resolveSaleInfo, isProductActive, getDbPrice]
  );

  return (
    <ShopImagesContext.Provider value={value}>
      {children}
    </ShopImagesContext.Provider>
  );
}

export function useShopImages(): ShopImagesContextValue {
  const ctx = useContext(ShopImagesContext);
  if (!ctx) {
    throw new Error('useShopImages must be used within ShopImagesProvider');
  }
  return ctx;
}
