import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  type LiveCatalogEntry,
} from '../services/supabaseService';
import { CFG_CODE_TO_PEPTIDE_ID, PEPTIDE_ID_TO_CFG } from '../data/productMappings';

type SaleInfo = { compareAtPrice: number; saleLabel: string | null };
type LiveProductInfo = LiveCatalogEntry;

type ShopImagesContextValue = {
  loading: boolean;
  /** True once the live catalog fetch has resolved at least once. */
  catalogLoaded: boolean;
  /** Resolved hero/card image: Supabase override when present, otherwise static catalogue. */
  resolveDisplayImage: (
    peptideId: string,
    variantId: string | undefined,
    staticFallbackUrl: string
  ) => string;
  /** Resolve sale info for a given peptide, or null if not on sale. */
  resolveSaleInfo: (peptideId: string) => SaleInfo | null;
  /** Check if a product is active in the database. */
  isProductActive: (peptideId: string) => boolean;
  /** Get live DB price for a product, or null if not available. */
  getDbPrice: (peptideId: string) => number | null;
  /** Storefront copy / bundle metadata from product_mappings (null if not in DB catalogue). */
  getLiveCatalogEntry: (peptideId: string) => LiveCatalogEntry | null;
  /** All products: static catalog merged with DB-only products created via admin. */
  allProducts: Peptide[];
};

const CATALOG_CACHE_KEY = 'laminin-shop-catalog-v1';
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

type CatalogCachePayload = {
  savedAt: number;
  overrideByPeptideId: Record<string, string>;
  saleInfoMap: Record<string, SaleInfo>;
  liveProductMap: Record<string, LiveProductInfo>;
  dbOnlyProducts: Peptide[];
};

function readCatalogCache(): CatalogCachePayload | null {
  try {
    const raw = sessionStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogCachePayload;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CATALOG_CACHE_TTL_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCatalogCache(payload: Omit<CatalogCachePayload, 'savedAt'>) {
  try {
    sessionStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch {
    // Ignore quota / private mode failures.
  }
}

const ShopImagesContext = createContext<ShopImagesContextValue | null>(null);

export function ShopImagesProvider({ children }: { children: ReactNode }) {
  const cached = typeof window !== 'undefined' ? readCatalogCache() : null;
  const [loading, setLoading] = useState(!cached);
  const [overrideByPeptideId, setOverrideByPeptideId] = useState<
    Record<string, string>
  >(cached?.overrideByPeptideId ?? {});
  const [saleInfoMap, setSaleInfoMap] = useState<Record<string, SaleInfo>>(
    cached?.saleInfoMap ?? {}
  );
  const [liveProductMap, setLiveProductMap] = useState<Record<string, LiveProductInfo>>(
    cached?.liveProductMap ?? {}
  );
  const [dbOnlyProducts, setDbOnlyProducts] = useState<Peptide[]>(
    cached?.dbOnlyProducts ?? []
  );
  /** True once the live catalog has been fetched at least once — before that we
   *  fall back to showing all static products so the page isn't blank. */
  const [catalogLoaded, setCatalogLoaded] = useState(Boolean(cached));

  /** Fetch all product data from Supabase and update state.
   *  `showLoading` controls whether the loading spinner appears (false for
   *  silent background refreshes on tab-focus). The returned function lets the
   *  caller mark its run as cancelled (used by effect cleanups). */
  const loadCatalog = useCallback(async (
    showLoading: boolean,
    isCancelled: () => boolean = () => false
  ) => {
    if (showLoading) setLoading(true);
    try {
      const [imageMap, saleByCfg, catalogByCfg] = await Promise.all([
        fetchShopPrimaryImageOverrides(),
        fetchProductSaleInfo(),
        fetchLiveProductCatalog(),
      ]);
      if (isCancelled()) return;

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
            const primaryImage = imageMap[syntheticId] ?? '/images/purity.png';
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
      setCatalogLoaded(true);
      writeCatalogCache({
        overrideByPeptideId: imageMap,
        saleInfoMap: mappedSale,
        liveProductMap: mappedLive,
        dbOnlyProducts: newDbProducts,
      });
    } catch (e) {
      // Don't strand `loading: true` on network error — finally always clears it
      // and the user can retry by navigating or refocusing the tab.
      if (!isCancelled()) {
        console.error('Failed to load shop catalog:', e);
      }
    } finally {
      if (!isCancelled() && showLoading) setLoading(false);
    }
  }, []);

  // Initial load — use cache for first paint, refresh in background when cached.
  useEffect(() => {
    let cancelled = false;
    void loadCatalog(!cached, () => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only mount once
  }, [loadCatalog]);

  // Re-fetch silently when the tab regains focus (picks up admin changes like
  // product deletions, price edits, or new products). Throttled so quick
  // tab flips don't hammer Supabase — minimum 60s between background refreshes.
  const lastRefreshRef = useRef<number>(0);
  const VISIBILITY_REFRESH_MIN_MS = 60_000;
  useEffect(() => {
    let cancelled = false;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !catalogLoaded) return;
      const now = Date.now();
      if (now - lastRefreshRef.current < VISIBILITY_REFRESH_MIN_MS) return;
      lastRefreshRef.current = now;
      void loadCatalog(false, () => cancelled);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadCatalog, catalogLoaded]);

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

  const staticPeptideIdSet = useMemo(
    () => new Set(allPeptides.map((p) => p.id)),
    []
  );

  const isProductActive = useCallback(
    (peptideId: string): boolean => {
      const info = liveProductMap[peptideId];
      if (info) return info.isActive;
      // Static catalog peptides are always shown when the DB has no opinion —
      // the hard-coded catalog is the source of truth, the DB only overrides.
      // This prevents the Library's "All" tab from hiding products that exist
      // in the static list but have no row in product_mappings.
      if (staticPeptideIdSet.has(peptideId)) return true;
      // Synthetic DB-only products with no live entry only happen mid-fetch.
      return !catalogLoaded;
    },
    [liveProductMap, catalogLoaded, staticPeptideIdSet]
  );

  const getDbPrice = useCallback(
    (peptideId: string): number | null => {
      const info = liveProductMap[peptideId];
      return info ? info.price : null;
    },
    [liveProductMap]
  );

  const getLiveCatalogEntry = useCallback(
    (peptideId: string): LiveCatalogEntry | null => liveProductMap[peptideId] ?? null,
    [liveProductMap]
  );

  const mergedAllProducts = useMemo(
    () => [...allPeptides, ...dbOnlyProducts],
    [dbOnlyProducts]
  );

  const value = useMemo(
    (): ShopImagesContextValue => ({
      loading,
      catalogLoaded,
      resolveDisplayImage,
      resolveSaleInfo,
      isProductActive,
      getDbPrice,
      getLiveCatalogEntry,
      allProducts: mergedAllProducts,
    }),
    [
      loading,
      catalogLoaded,
      resolveDisplayImage,
      resolveSaleInfo,
      isProductActive,
      getDbPrice,
      getLiveCatalogEntry,
      mergedAllProducts,
    ]
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
