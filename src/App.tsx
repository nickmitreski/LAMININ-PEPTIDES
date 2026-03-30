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
import Home from './pages/Home';
import Library from './pages/Library';
import COA from './pages/COA';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Guarantee from './pages/Guarantee';
import NotFound from './pages/NotFound';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ProductPage from './pages/ProductPage';
import AdminInventory from './pages/AdminInventory';
import EntryGate from './components/entry/EntryGate';

function App() {
  return (
    <Router>
      <EntryGate>
        <SkipLink />
        <ScrollToTop />
        <div className="min-h-screen bg-platinum text-carbon-900">
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
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms-and-conditions" element={<Terms />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </EntryGate>
    </Router>
  );
}

export default App;
