import { describe, it, expect } from 'vitest';
import { allPeptides } from './peptides';
import {
  PRODUCT_MAPPINGS,
  PEPTIDE_ID_TO_CFG,
  getCfgCodeForPeptideId,
} from './productMappings';
import {
  getNumericPriceForVariantOrPeptide,
  getVariants,
} from './productPricing';

/**
 * Variant SKUs whose CFG mapping `price` matches this variant (not the cheapest option).
 * Documented here so drift between storefront and bridge payload is caught in CI.
 */
const MAPPING_REFERENCE_VARIANT: Partial<Record<string, string>> = {
  retatrutide: '10mg',
  'bpc-157': '10mg',
  'ghk-cu': '100mg',
};

describe('catalog ↔ CFG integrity', () => {
  it('every library peptide has a CFG code', () => {
    for (const p of allPeptides) {
      const cfg = getCfgCodeForPeptideId(p.id);
      expect(cfg, `missing CFG for peptide id: ${p.id}`).toBeTruthy();
      expect(PRODUCT_MAPPINGS[cfg!], `missing PRODUCT_MAPPINGS for ${cfg}`).toBeDefined();
    }
  });

  it('PEPTIDE_ID_TO_CFG keys are a subset of catalogue ids', () => {
    const ids = new Set(allPeptides.map((p) => p.id));
    for (const id of Object.keys(PEPTIDE_ID_TO_CFG)) {
      expect(ids.has(id), `orphan mapping for unknown peptide id: ${id}`).toBe(true);
    }
  });

  it('mapping reference price matches storefront price for the canonical variant or base SKU', () => {
    for (const p of allPeptides) {
      const cfg = getCfgCodeForPeptideId(p.id);
      expect(cfg).toBeTruthy();
      const mapPrice = PRODUCT_MAPPINGS[cfg!].price;

      const variantId = MAPPING_REFERENCE_VARIANT[p.id];
      const variants = getVariants(p.id);
      if (variants?.length && variantId) {
        const v = variants.find((x) => x.id === variantId);
        expect(v, `reference variant ${variantId} missing for ${p.id}`).toBeDefined();
        expect(
          mapPrice,
          `PRODUCT_MAPPINGS[${cfg}].price should match ${p.id} ${variantId} storefront price`
        ).toBe(v!.price);
      } else {
        const n = getNumericPriceForVariantOrPeptide(p.id);
        expect(n, `no storefront price for ${p.id}`).not.toBeNull();
        expect(
          mapPrice,
          `PRODUCT_MAPPINGS[${cfg}].price should match base price for ${p.id}`
        ).toBe(n);
      }
    }
  });
});
