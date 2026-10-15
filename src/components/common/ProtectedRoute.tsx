import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Store, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAIL } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['seller'],
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Not signed in
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="w-full bg-[#FBF9F6] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-[#E8E2D9] shadow-sm max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#0F5132] flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
              Farmer / Seller Portal
            </span>
            <h2 className="font-extrabold text-2xl text-[#111827]">
              Sign In to List Produce
            </h2>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              Only verified Farmers, Agricultural Cooperatives, and Produce Sellers can list harvests on the Benue Marketplace. Please sign in or create a free seller account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In as Seller / Farmer</span>
            </Link>

            <Link
              to="/register?role=farmer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold py-3 px-4 rounded-xl border border-[#D6CDC0] transition-colors"
            >
              <span>Create Free Farmer Account</span>
            </Link>

            <div className="pt-3 border-t border-[#E8E2D9]">
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5132] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Browse Produce</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged in, but role is restricted (e.g. Buyer trying to access Seller page)
  const isSuper = currentUser.role === 'super_admin' || currentUser.isSuperAdmin || (currentUser.email && currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
  const isAuthorized = isSuper || allowedRoles.includes(currentUser.role);

  if (!isAuthorized) {
    return (
      <div className="w-full bg-[#FBF9F6] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-amber-200 shadow-sm max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Seller Account Required
            </span>
            <h2 className="font-extrabold text-2xl text-[#111827]">
              Restricted to Farmers & Producers
            </h2>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              You are currently signed in as a <strong className="text-[#111827]">Buyer / Merchant</strong>. To maintain high produce quality and direct farmgate credibility, listing harvests is reserved for registered <strong className="text-[#0F5132]">Farmers, Cooperatives, and Produce Sellers</strong>.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* SECURITY: Role upgrades must go through proper registration/verification, not client-side switch */}
            <Link
              to="/register?role=farmer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <Store className="w-4 h-4 text-[#FEF3C7]" />
              <span>Register as Farmer / Seller</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/buyer-dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold py-3 px-4 rounded-xl border border-[#D6CDC0] transition-colors"
            >
              <span>Go to Buyer Dashboard</span>
            </Link>

            <div className="pt-2">
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5132] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Browsing Produce as Buyer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
