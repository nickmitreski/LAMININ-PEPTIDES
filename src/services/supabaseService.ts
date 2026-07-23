/** Re-exports for backward compatibility — import from focused services when adding new code. */
export { paymentRowToOrder } from './orderMappers';
export type {
  CustomerInput,
  OrderCounts,
  OrderReferenceRow,
  OrderStatus,
  OrderStatusHistoryRow,
  PaymentEventRow,
  PaymentTrackingDbRow,
  PaymentTrackingRow,
  RecentEmailFailure,
} from './orderTypes';

export { getProductMappings } from './productMappingsService';
export {
  adminListAllCollections,
  createCollectionRow,
  getCollectionIdsForProduct,
  getCollectionMetaBySlug,
  getPeptideIdsInCollectionSlug,
  listCollections,
  setProductCollections,
  updateCollectionRow,
} from './collectionsService';
export type { Collection } from './collectionsService';
export {
  deleteResearchProfileOverride,
  fetchResearchProfileOverrides,
  upsertResearchProfileOverride,
} from './researchOverridesService';
export type { ResearchProfileOverrideRow } from './researchOverridesService';
export {
  archivePayment,
  getPaymentTrackingMap,
  markPaymentReceived,
} from './paymentTrackingService';

export {
  cancelOrder,
  createOrderReference,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrderByReference,
  getOrderCounts,
  getOrdersByStatus,
  getOrderStatus,
  getOrderStatusHistory,
  getPaymentEventsByReference,
  getRecentEmailFailures,
  createAdminInvoice,
  listDuePaymentReminders,
  markPaymentReminderSent,
  replaceAdminOrderLines,
  updateOrderStatus,
} from './ordersService';
export type {
  ReplaceAdminOrderLinesResult,
  CreateAdminInvoiceResult,
  PaymentReminderRow,
} from './ordersService';

export {
  adminUpdateCustomer,
  createCustomer,
  deleteCustomerAndOrders,
  getAllCustomers,
} from './customersService';

export {
  createProduct,
  deleteProduct,
  deleteProductImageRecord,
  duplicateProduct,
  fetchLiveProductCatalog,
  fetchProductSaleInfo,
  fetchShopPrimaryImageOverrides,
  getAllProductMappings,
  getProductWithImages,
  saveProductImage,
  setPrimaryProductImage,
  suggestNextCfgCode,
  updateProduct,
} from './productAdminService';
export type { AdminProductWithImages, LiveCatalogEntry } from './productAdminService';
