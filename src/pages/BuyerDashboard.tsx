import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, LogOut, Store, ArrowRight, MapPin, Eye, Settings, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/marketplace/ProductCard';
import { PRODUCE_CATEGORIES } from '../constants/benue';
import { ProfileCoverEditModal } from '../components/farmer/ProfileCoverEditModal';
import { ReportModal } from '../components/common/ReportModal';

export const BuyerDashboard: React.FC = () => {
  const { currentUser, logout, switchRole, updateCoverImage, updateProfileImage } = useAuth();
  const { savedProductIds, products, recentlyViewedProducts } = useProducts();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const savedProducts = products.filter((p) => savedProductIds.includes(p.id));

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12 relative">
      {/* Profile Edit Modal */}
      <ProfileCoverEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={currentUser}
        onSaveCover={(coverUrl) => updateCoverImage(coverUrl)}
        onSaveAvatar={(avatarUrl) => updateProfileImage(avatarUrl)}
        isBuyerMode={true}
      />

      {/* Buyer Report Seller / Product Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="seller"
        targetId="general-seller-inquiry"
        targetName="Marketplace Seller / Produce Listing"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        {/* Buyer Header Banner */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-extrabold text-xl ring-2 ring-[#C8E6C9] shrink-0 overflow-hidden">
              {currentUser?.profileImage ? (
                <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0) || 'B'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
                  Buyer & Merchant Dashboard
                </span>
                <span className="text-[10px] bg-[#E8F5E9] text-[#0F5132] font-bold px-2 py-0.5 rounded-full border border-[#C8E6C9]">
                  Verified Buyer
                </span>
              </div>
              <h1 className="font-extrabold text-2xl text-[#111827]">{currentUser?.name}</h1>
              <p className="text-xs text-[#4B5563]">{currentUser?.email} • {currentUser?.phone}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#111827] border border-[#D6CDC0] text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Settings className="w-4 h-4 text-[#0F5132]" />
              <span>Customize Avatar & Cover</span>
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
              title="Report scam, fake product, or suspicious seller"
            >
              <Flag className="w-4 h-4 text-red-600" />
              <span>Report Seller or Produce</span>
            </button>

            <Link
              to="/browse"
              className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Browse Benue Produce</span>
            </Link>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 bg-[#FBF9F6] text-red-600 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Overview Stats for Buyer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Saved Produce Items</span>
            <div className="font-extrabold text-3xl text-[#0F5132]">{savedProducts.length}</div>
            <p className="text-[11px] text-[#B45309] font-medium">Bookmarked for quick farmgate contact</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Recently Viewed</span>
            <div className="font-extrabold text-3xl text-[#B45309]">{recentlyViewedProducts.length}</div>
            <p className="text-[11px] text-[#0F5132] font-medium">Produce items inspected</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Local Coverage</span>
            <div className="font-extrabold text-2xl text-[#0F5132] flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-[#0F5132]" />
              <span>23 Benue LGAs</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">Direct producer farmgate pricing</p>
          </div>
        </div>

        {/* Saved Produce Items Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xl text-[#0F5132] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#B45309] fill-current" />
              <span>Saved Produce Items ({savedProducts.length})</span>
            </h2>
            {savedProducts.length > 0 && (
              <Link to="/browse" className="text-xs font-bold text-[#0F5132] hover:underline">
                + Browse More Produce
              </Link>
            )}
          </div>

          {savedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-[#E8E2D9] text-center space-y-3 max-w-md mx-auto shadow-sm">
              <Heart className="w-12 h-12 text-[#9CA3AF] mx-auto" />
              <h3 className="font-bold text-lg text-[#111827]">No Saved Produce Items</h3>
              <p className="text-xs text-[#4B5563]">
                Click the heart icon on any produce card while browsing to save it for quick access later.
              </p>
              <Link
                to="/browse"
                className="inline-block bg-[#0F5132] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#0B3D26] shadow-sm transition-colors"
              >
                Browse Produce Now
              </Link>
            </div>
          )}
        </div>

        {/* Recently Viewed Produce Section */}
        {recentlyViewedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-xl text-[#111827] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0F5132]" />
                <span>Recently Viewed Produce ({recentlyViewedProducts.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Category Exploration */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-[#111827]">Explore Agricultural Sectors</h3>
              <p className="text-xs text-[#4B5563]">Direct supply from registered Benue growers</p>
            </div>
            <Link to="/browse" className="text-xs font-bold text-[#0F5132] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {PRODUCE_CATEGORIES.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                to={`/browse?category=${cat.id}`}
                className="p-3 rounded-xl bg-[#FBF9F6] hover:bg-[#E8F5E9] border border-[#E8E2D9] transition-colors text-center space-y-1 group"
              >
                <span className="text-xs font-bold text-[#111827] group-hover:text-[#0F5132] block">
                  {cat.name}
                </span>
                <span className="text-[10px] text-[#6B7280] block">Direct farm supply</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Farmer Upgrade Banner if Buyer wants to sell harvest */}
        <div className="bg-[#E8F5E9] p-6 rounded-2xl border border-[#C8E6C9] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F5132] text-white flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-[#FEF3C7]" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#111827]">Are you a Farmer or Agricultural Producer?</h4>
              <p className="text-xs text-[#4B5563]">
                Switch to a Seller account to list your white yams, grains, citrus, or livestock directly to buyers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => switchRole('seller')}
            className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <span>Switch to Farmer Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};


