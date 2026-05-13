import { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import SkipLink from './components/layout/SkipLink';
import PageFallback from './components/routing/PageFallback';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { AdminAuthProvider } from './context/AdminAuthContext';
import EntryGate from './components/entry/EntryGate';
import ChatLauncher from './components/chat/ChatLauncher';
import { ShopImagesProvider } from './context/ShopImagesContext';
import AdminErrorBoundary from './components/admin/AdminErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const Library = lazy(() => import('./pages/Library'));
const SiteSearch = lazy(() => import('./pages/SiteSearch'));
const ResearchLibrary = lazy(() => import('./pages/ResearchLibrary'));
const COA = lazy(() => import('./pages/COA'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Guarantee = lazy(() => import('./pages/Guarantee'));
const ReconstitutionCalculator = lazy(() => import('./pages/ReconstitutionCalculator'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const Shipping = lazy(() => import('./pages/Shipping'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const AdminInventory = lazy(() => import('./pages/AdminInventory'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminCustomers = lazy(() => import('./pages/AdminCustomers'));
const AdminDiscounts = lazy(() => import('./pages/AdminDiscounts'));
const AdminEmails = lazy(() => import('./pages/AdminEmails'));
const AdminTools = lazy(() => import('./pages/AdminTools'));
const AdminResearch = lazy(() => import('./pages/AdminResearch'));
const AdminCollections = lazy(() => import('./pages/AdminCollections'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <EntryGate>
          <SkipLink />
          <ScrollToTop />
          <ChatLauncher />
          <div className="min-h-screen bg-platinum text-carbon-900">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Admin Routes (no header/footer) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Orders">
                        <AdminDashboard />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Products">
                        <AdminProducts />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route path="/admin/payments" element={<Navigate to="/admin/dashboard" replace />} />
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Inventory">
                        <AdminInventory />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/discounts"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Discounts">
                        <AdminDiscounts />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/customers"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Customers">
                        <AdminCustomers />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/emails"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Emails">
                        <AdminEmails />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tools"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Tools">
                        <AdminTools />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/research"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Research">
                        <AdminResearch />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/collections"
                  element={
                    <ProtectedRoute>
                      <AdminErrorBoundary pageName="Collections">
                        <AdminCollections />
                      </AdminErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Public Routes (with header/footer) */}
                <Route
                  path="/*"
                  element={
                    <ShopImagesProvider>
                      <>
                        <Header />
                        <main
                          id="main-content"
                          tabIndex={-1}
                          className="focus:outline-none"
                        >
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/collections/:collectionSlug" element={<Library />} />
                            <Route path="/search" element={<SiteSearch />} />
                            <Route
                              path="/research"
                              element={<ResearchLibrary />}
                            />
                            <Route
                              path="/products/:slug"
                              element={<ProductPage />}
                            />
                            <Route path="/faq" element={<FAQ />} />
                            <Route
                              path="/collection"
                              element={<Navigate to="/faq" replace />}
                            />
                            <Route path="/coa" element={<COA />} />
                            <Route path="/guarantee" element={<Guarantee />} />
                            <Route
                              path="/reconstitution-calculator"
                              element={<ReconstitutionCalculator />}
                            />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route
                              path="/order-confirmation"
                              element={<OrderConfirmation />}
                            />
                            <Route path="/oops" element={<ErrorPage />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route
                              path="/terms-and-conditions"
                              element={<Navigate to="/disclaimer" replace />}
                            />
                            <Route path="/disclaimer" element={<Disclaimer />} />
                            <Route path="/shipping" element={<Shipping />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <Footer />
                      </>
                    </ShopImagesProvider>
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </EntryGate>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
