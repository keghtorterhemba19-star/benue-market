import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { ProductDetail } from './pages/ProductDetail';
import { Directory } from './pages/Directory';
import { FarmerProfile } from './pages/FarmerProfile';
import { SellProduce } from './pages/SellProduce';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Terms } from './pages/Terms';
import { TermsUpdateModal } from './components/common/TermsUpdateModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Helper component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProductProvider>
        <Router>
          <ScrollToTop />
          <TermsUpdateModal />
          <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
            <Navbar />
            <main className="flex-grow pt-[112px] sm:pt-[116px] md:pt-[120px] lg:pt-[104px] pb-20 lg:pb-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/farmer/:id" element={<FarmerProfile />} />
                <Route
                  path="/sell-produce"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'admin', 'super_admin']}>
                      <SellProduce />
                    </ProtectedRoute>
                  }
                />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/support" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Terms />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/buyer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'seller', 'admin', 'super_admin']}>
                      <BuyerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farmer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['seller', 'admin', 'super_admin']}>
                      <FarmerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ProductProvider>
    </AuthProvider>
  );
};

export default App;
