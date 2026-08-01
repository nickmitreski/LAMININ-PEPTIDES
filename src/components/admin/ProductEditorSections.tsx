import type { ChangeEvent } from 'react';
import { Heading } from '../ui/Typography';

type BasicInfoProps = {
  peptideName: string;
  proteinName: string;
  cfgCode: string;
  description: string;
  category: string;
  isActive: boolean;
  onPeptideName: (v: string) => void;
  onProteinName: (v: string) => void;
  onDescription: (v: string) => void;
  onCategory: (v: string) => void;
  onIsActive: (v: boolean) => void;
};

export function ProductEditorBasicInfo({
  peptideName,
  proteinName,
  cfgCode,
  description,
  category,
  isActive,
  onPeptideName,
  onProteinName,
  onDescription,
  onCategory,
  onIsActive,
}: BasicInfoProps) {
  return (
    <div>
      <Heading level={3} className="mb-4">
        Product information
      </Heading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Product name *</label>
          <input
            type="text"
            value={peptideName}
            onChange={(e) => onPeptideName(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Protein name</label>
          <input
            type="text"
            value={proteinName}
            onChange={(e) => onProteinName(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-carbon-700">CFG code (read-only)</label>
          <input type="text" value={cfgCode} disabled className="w-full rounded-sm border border-carbon-200 bg-carbon-50 px-3 py-2 text-carbon-500" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-carbon-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            rows={3}
            className="input w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Category</label>
          <select
            value={category}
            onChange={(e) => onCategory(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          >
            <option value="">Choose a category</option>
            {['Healing', 'Cognitive', 'Metabolic', 'Performance', 'Longevity'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 pt-8">
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => onIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-carbon-300 text-accent-600 focus:ring-accent-500"
            />
            <span className="text-sm font-medium text-carbon-700">Active product</span>
          </label>
        </div>
      </div>
    </div>
  );
}

type PricingProps = {
  price: string;
  compareAtPrice: string;
  saleLabel: string;
  sortOrder: string;
  onPrice: (v: string) => void;
  onCompareAtPrice: (v: string) => void;
  onSaleLabel: (v: string) => void;
  onSortOrder: (v: string) => void;
};

export function ProductEditorPricing({
  price,
  compareAtPrice,
  saleLabel,
  sortOrder,
  onPrice,
  onCompareAtPrice,
  onSaleLabel,
  onSortOrder,
}: PricingProps) {
  return (
    <div>
      <Heading level={3} className="mb-4">
        Pricing
      </Heading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Price (AUD) *</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-carbon-600">$</span>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => onPrice(e.target.value)}
              className="input min-h-11 w-full rounded-sm border border-carbon-200 py-2 pl-7 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Compare-at price</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-carbon-600">$</span>
            <input
              type="number"
              step="0.01"
              value={compareAtPrice}
              onChange={(e) => onCompareAtPrice(e.target.value)}
              className="input min-h-11 w-full rounded-sm border border-carbon-200 py-2 pl-7 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Sale label</label>
          <input
            type="text"
            value={saleLabel}
            onChange={(e) => onSaleLabel(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => onSortOrder(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
      </div>
    </div>
  );
}

type InventoryProps = {
  stockQuantity: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  onStockQuantity: (v: string) => void;
  onLowStockThreshold: (v: string) => void;
  onTrackInventory: (v: boolean) => void;
};

export function ProductEditorInventory({
  stockQuantity,
  lowStockThreshold,
  trackInventory,
  onStockQuantity,
  onLowStockThreshold,
  onTrackInventory,
}: InventoryProps) {
  return (
    <div>
      <Heading level={3} className="mb-4">
        Inventory
      </Heading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Stock quantity</label>
          <input
            type="number"
            value={stockQuantity}
            onChange={(e) => onStockQuantity(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-carbon-700">Low stock alert</label>
          <input
            type="number"
            value={lowStockThreshold}
            onChange={(e) => onLowStockThreshold(e.target.value)}
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          />
        </div>
        <div className="flex items-end">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={(e) => onTrackInventory(e.target.checked)}
              className="h-4 w-4 rounded border-carbon-300 text-accent-600"
            />
            <span className="text-sm font-medium text-carbon-700">Track inventory</span>
          </label>
        </div>
      </div>
    </div>
  );
}

type StorefrontProps = {
  overviewText: string;
  specificationsText: string;
  analyticalText: string;
  coaLinkUrl: string;
  onOverview: (v: string) => void;
  onSpecifications: (v: string) => void;
  onAnalytical: (v: string) => void;
  onCoaLink: (v: string) => void;
};

export function ProductEditorStorefrontCopy({
  overviewText,
  specificationsText,
  analyticalText,
  coaLinkUrl,
  onOverview,
  onSpecifications,
  onAnalytical,
  onCoaLink,
}: StorefrontProps) {
  return (
    <div>
      <Heading level={3} className="mb-4">
        Storefront copy
      </Heading>
      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-carbon-700">Overview</span>
          <textarea
            value={overviewText}
            onChange={(e) => onOverview(e.target.value)}
            rows={5}
            placeholder="Explain what this product is and how it is supplied."
            className="input w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-carbon-700">Specifications</span>
          <textarea
            value={specificationsText}
            onChange={(e) => onSpecifications(e.target.value)}
            rows={4}
            placeholder="Strength, form, purity and packaging details."
            className="input w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-carbon-700">Analytical verification</span>
          <textarea
            value={analyticalText}
            onChange={(e) => onAnalytical(e.target.value)}
            rows={4}
            placeholder="Describe the verification or testing information shown on the product page."
            className="input w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-carbon-700">External COA fallback link</span>
          <input
            type="url"
            value={coaLinkUrl}
            onChange={(e) => onCoaLink(e.target.value)}
            placeholder="https://…"
            className="input min-h-11 w-full rounded-sm border border-carbon-200 px-3 py-2 text-base md:text-sm"
          />
          <span className="mt-1 block text-xs text-carbon-500">The Images &amp; COA tab manages uploaded certificates. Use this only for a trusted external document.</span>
        </label>
      </div>
    </div>
  );
}

type Collection = { id: string; name: string; slug: string };

type BundleProps = {
  productType: 'standard' | 'bundle';
  bundleItemsJson: string;
  allCollections: Collection[];
  selectedCollectionIds: string[];
  onProductType: (v: 'standard' | 'bundle') => void;
  onBundleJson: (v: string) => void;
  onToggleCollection: (id: string) => void;
};

export function ProductEditorBundleCollections({
  productType,
  bundleItemsJson,
  allCollections,
  selectedCollectionIds,
  onProductType,
  onBundleJson,
  onToggleCollection,
}: BundleProps) {
  return (
    <div>
      <Heading level={3} className="mb-4">
        Product type &amp; collections
      </Heading>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <select
          value={productType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onProductType(e.target.value as 'standard' | 'bundle')
          }
          className="input min-h-11 w-full rounded-sm border border-carbon-200 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 md:text-sm"
          aria-label="Product type"
        >
          <option value="standard">Standard</option>
          <option value="bundle">Bundle</option>
        </select>
        {productType === 'bundle' && (
          <div className="md:col-span-2">
            <textarea
              value={bundleItemsJson}
              onChange={(e) => onBundleJson(e.target.value)}
              rows={4}
              className="w-full rounded-sm border border-carbon-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder='[{"cfg_code":"CFG-031","qty":1}]'
              aria-label="Bundle items JSON"
            />
          </div>
        )}
      </div>
      <div className="mt-4 max-h-40 space-y-2 overflow-y-auto rounded-sm border border-carbon-200 p-3">
        {allCollections.map((c) => (
          <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedCollectionIds.includes(c.id)}
              onChange={() => onToggleCollection(c.id)}
              className="rounded border-carbon-300 text-accent-600"
            />
            <span>
              {c.name} <span className="font-mono text-xs text-carbon-500">({c.slug})</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
