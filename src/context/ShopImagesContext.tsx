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
import { fetchShopPrimaryImageOverrides } from '../services/supabaseService';

type ShopImagesContextValue = {
  loading: boolean;
  /** Resolved hero/card image: Supabase override when present, otherwise static catalogue. */
  resolveDisplayImage: (
    peptideId: string,
    variantId: string | undefined,
    staticFallbackUrl: string
  ) => string;
};

const ShopImagesContext = createContext<ShopImagesContextValue | null>(null);

export function ShopImagesProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [overrideByPeptideId, setOverrideByPeptideId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const map = await fetchShopPrimaryImageOverrides();
        if (!cancelled) setOverrideByPeptideId(map);
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

  const value = useMemo(
    (): ShopImagesContextValue => ({
      loading,
      resolveDisplayImage,
    }),
    [loading, resolveDisplayImage]
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
