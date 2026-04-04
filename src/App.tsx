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

const Home = lazy(() => import('./pages/Home'));
const Library = lazy(() => import('./pages/Library'));
const COA = lazy(() => import('./pages/COA'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Guarantee = lazy(() => import('./pages/Guarantee'));
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
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <EntryGate>
          <SkipLink />
          <ScrollToTop />
          <div className="min-h-screen bg-platinum text-carbon-900">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Admin Routes (no header/footer) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute>
                      <AdminProducts />
                    </ProtectedRoute>
                  }
                />

                {/* Public Routes (with header/footer) */}
                <Route
                  path="/*"
                  element={
                    <>
                      <Header />
                      <main id="main-content">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/library" element={<Library />} />
                          <Route path="/products/:slug" element={<ProductPage />} />
                          <Route path="/faq" element={<FAQ />} />
                          <Route path="/collection" element={<Navigate to="/faq" replace />} />
                          <Route path="/coa" element={<COA />} />
                          <Route path="/guarantee" element={<Guarantee />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-confirmation" element={<OrderConfirmation />} />
                        <Route path="/oops" element={<ErrorPage />} />
                        <Route path="/privacy" element={<Privacy />} />
                          <Route
                            path="/terms-and-conditions"
                            element={<Navigate to="/disclaimer" replace />}
                          />
                          <Route path="/disclaimer" element={<Disclaimer />} />
                          <Route path="/shipping" element={<Shipping />} />
                          <Route
                            path="/admin/inventory"
                            element={
                              <ProtectedRoute>
                                <AdminInventory />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Footer />
                    </>
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
