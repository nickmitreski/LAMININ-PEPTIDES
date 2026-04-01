import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { PRODUCT_MAPPINGS } from '../data/productMappings';
import type { CartItem } from '../types/cart';

vi.mock('./supabaseService', () => ({
  getProductMappings: vi.fn(() => Promise.resolve({ ...PRODUCT_MAPPINGS })),
  createCustomer: vi.fn(() => Promise.resolve(null)),
  createOrderReference: vi.fn(() => Promise.resolve({ id: 'test-row-id' })),
}));

import {
  buildCheckoutCartLines,
  redirectToProteinStore,
  generatePeptideOrderId,
} from './proteinCheckout';
import * as supabaseService from './supabaseService';

const baseItem = (over: Partial<CartItem> = {}): CartItem => ({
  peptideId: 'cjc-1295-no-dac',
  name: 'CJC-1295 (no DAC)',
  price: 119,
  quantity: 1,
  image: '/img.png',
  purity: '99%+',
  ...over,
});

const customer = {
  email: 'a@b.com',
  first_name: 'A',
  last_name: 'B',
  phone: '1',
  address: '1 St',
  city: 'S',
  state: 'NSW',
  postcode: '2000',
  country: 'Australia',
};

const totals = { subtotal: 119, shipping: 15, tax: 11.9, grand_total: 145.9 };

describe('buildCheckoutCartLines', () => {
  it('maps cart lines to peptide and protein payloads with CFG codes', () => {
    const { peptide_items, protein_items } = buildCheckoutCartLines(
      [baseItem()],
      PRODUCT_MAPPINGS
    );
    expect(peptide_items).toHaveLength(1);
    expect(peptide_items[0].cfg_code).toBe('CFG-001');
    expect(protein_items[0].protein_name).toContain('CoreForge');
    expect(peptide_items[0].line_total).toBe(119);
  });

  it('includes variant suffix in display name when variantId is set', () => {
    const { peptide_items } = buildCheckoutCartLines(
      [
        baseItem({
          peptideId: 'retatrutide',
          name: 'Retatrutide',
          variantId: '20mg',
          price: 249,
        }),
      ],
      PRODUCT_MAPPINGS
    );
    expect(peptide_items[0].cfg_code).toBe('CFG-023');
    expect(peptide_items[0].peptide_display_name).toContain('20mg');
    expect(peptide_items[0].variant_id).toBe('20mg');
  });

  it('throws when peptide has no CFG mapping', () => {
    expect(() =>
      buildCheckoutCartLines(
        [baseItem({ peptideId: 'unknown-product' })],
        PRODUCT_MAPPINGS
      )
    ).toThrow(/No CFG mapping/);
  });

  it('throws when CFG is missing from mapping table', () => {
    const badMap = { ...PRODUCT_MAPPINGS };
    delete (badMap as Record<string, unknown>)['CFG-001'];
    expect(() => buildCheckoutCartLines([baseItem()], badMap)).toThrow(/Unknown CFG code/);
  });
});

describe('redirectToProteinStore', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    vi.unstubAllEnvs();
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('soft launch skips partner API and returns same-origin confirmation URL', async () => {
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'true');
    vi.stubEnv('VITE_PROTEIN_STORE_URL', 'https://partner.example');

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.redirectUrl).toContain('/order-confirmation');
    expect(result.redirectUrl).toContain('pending_payment=1');
    expect(result.peptide_order_id).toMatch(/^PEP-/);
  });

  it('without partner URL skips API and returns same-origin confirmation', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', '');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.redirectUrl).toContain('/order-confirmation');
    expect(result.redirectUrl).toContain('pending_payment=1');
  });

  it('production: POSTs checkout bridge and uses redirect_url from JSON body', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', 'https://partner.example');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');
    vi.stubEnv('VITE_PROTEIN_STORE_API_KEY', 'secret');

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ redirect_url: 'https://partner.example/pay/xyz' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://partner.example/api/peptide-bridge/checkout');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string).peptide_order_id).toBeTruthy();
    expect(result.redirectUrl).toBe('https://partner.example/pay/xyz');
  });

  it('production: non-OK API falls back to checkout?ref=', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', 'https://partner.example');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');

    fetchMock.mockResolvedValue(new Response('Server error', { status: 500 }));

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(result.redirectUrl).toContain('https://partner.example/checkout?ref=');
    expect(result.redirectUrl).toContain(encodeURIComponent(result.peptide_order_id));
  });

  it('production: network failure still returns fallback partner checkout URL', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', 'https://partner.example');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');

    fetchMock.mockRejectedValue(new Error('Network down'));

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(result.redirectUrl).toContain('https://partner.example/checkout?ref=');
  });

  it('production: accepts checkout_url and url aliases in JSON body', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', 'https://partner.example');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ checkout_url: 'https://partner.example/c/1' }), {
        status: 200,
      })
    );

    let result = await redirectToProteinStore([baseItem()], customer, totals);
    expect(result.redirectUrl).toBe('https://partner.example/c/1');

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://partner.example/c/2' }), { status: 200 })
    );

    result = await redirectToProteinStore([baseItem()], customer, totals);
    expect(result.redirectUrl).toBe('https://partner.example/c/2');
  });

  it('still loads mappings via supabaseService', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', '');
    await redirectToProteinStore([baseItem()], customer, totals);
    expect(supabaseService.getProductMappings).toHaveBeenCalled();
  });

  it('production: 200 with invalid JSON keeps default partner checkout URL', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', 'https://partner.example');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');

    fetchMock.mockResolvedValueOnce(
      new Response('not json', { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(result.redirectUrl).toContain('https://partner.example/checkout?ref=');
  });

  it('treats whitespace-only partner URL as unset', async () => {
    vi.stubEnv('VITE_PROTEIN_STORE_URL', '   ');
    vi.stubEnv('VITE_CHECKOUT_SOFT_LAUNCH', 'false');

    const result = await redirectToProteinStore([baseItem()], customer, totals);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.redirectUrl).toContain('/order-confirmation');
  });
});

describe('generatePeptideOrderId', () => {
  it('matches PEP-YYYYMMDD-XXXX pattern', () => {
    const id = generatePeptideOrderId();
    expect(id).toMatch(/^PEP-\d{8}-[A-Z0-9]{4}$/);
  });
});
