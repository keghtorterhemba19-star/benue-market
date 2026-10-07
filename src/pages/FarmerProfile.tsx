import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, ShieldCheck, ArrowLeft, Star, Calendar, Flag, MessageSquarePlus } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/marketplace/ProductCard';
import { generateTelLink, generateWhatsappLink } from '../utils/formatters';
import { SellerRatingModal } from '../components/farmer/SellerRatingModal';
import { ReportModal } from '../components/common/ReportModal';

export const FarmerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, users, getUserById, getSellerReviews } = useAuth();
  const { getProductsBySeller } = useProducts();

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const farmer = getUserById(id || '') || users.find((u) => u.id === id) || MOCK_USERS.find((u) => u.id === id) || MOCK_USERS[0];
  const farmerListings = getProductsBySeller(farmer.id);
  const sellerReviews = getSellerReviews(farmer.id);

  const telUrl = generateTelLink(farmer.phone);
  const whatsappUrl = generateWhatsappLink(
    farmer.whatsapp || farmer.phone,
    farmer.name,
    'Produce Catalog Inquiry',
    0,
    'Batch'
  );

  const joinedDate = farmer.createdAt
    ? new Date(farmer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2024';

  const isAvailable = farmer.availabilityStatus !== 'away';
  const rating = farmer.averageRating || 4.8;
  const reviewCount = farmer.reviewCount || (sellerReviews.length > 0 ? sellerReviews.length : 12);

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12">
      {/* Modals */}
      <SellerRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        sellerId={farmer.id}
        sellerName={farmer.name}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="seller"
        targetId={farmer.id}
        targetName={farmer.name}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/directory"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F5132] hover:text-[#0B3D26] bg-white px-3.5 py-2 rounded-xl border border-[#D6CDC0] shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Farmers Directory</span>
          </Link>

          {currentUser?.role !== 'seller' && currentUser?.id !== farmer.id && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl border border-red-200 transition-colors shadow-xs"
              title="Report scam, fake seller or inappropriate behavior"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Seller</span>
            </button>
          )}
        </div>

        {/* Profile Card with Cover Photo Banner */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden space-y-0">
          {/* Cover Picture Banner */}
          <div className="h-44 sm:h-56 md:h-60 w-full relative overflow-hidden bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26]">
            <img
              src={farmer.coverImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600'}
              alt={`${farmer.name} Farm Banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>

          <div className="p-6 md:p-8 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-14 sm:-mt-16 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl ring-4 ring-white shadow-xl shrink-0 overflow-hidden">
                {farmer.profileImage ? (
                  <img src={farmer.profileImage} alt={farmer.name} className="w-full h-full object-cover" />
                ) : (
                  farmer.name.charAt(0)
                )}
              </div>

              <div className="space-y-1.5 pb-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="font-extrabold text-2xl sm:text-3xl text-[#111827]">{farmer.name}</h1>
                  {farmer.isVerified && (
                    <ShieldCheck className="w-6 h-6 text-[#0F5132]" />
                  )}

                  {/* Availability Badge */}
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                      isAvailable
                        ? 'bg-[#E8F5E9] text-[#0F5132] border-[#C8E6C9]'
                        : 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-[#10B981] animate-pulse' : 'bg-[#B45309]'}`} />
                    <span>{isAvailable ? 'Available & Trading' : 'Away / Off-Season'}</span>
                  </span>
                </div>

                {/* Location, Rating, Joined Date Row */}
                <div className="flex items-center flex-wrap gap-3 text-xs sm:text-sm text-[#4B5563] font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#0F5132]" />
                    <span>{farmer.location || `${farmer.lga} LGA`}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-[#B45309]">
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>{rating} / 5.0 ({reviewCount} Reviews)</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-gray-500 font-medium">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Member since {joinedDate}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs uppercase font-extrabold bg-[#E8F5E9] text-[#0F5132] px-2.5 py-0.5 rounded border border-[#C8E6C9]">
                    {farmer.userType || 'Farmer'}
                  </span>
                  <span className="text-xs text-[#B45309] font-bold">
                    {farmer.completedTradesCount || 10}+ Successful Trades
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Contact Triggers & Review Button */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#B45309] text-xs font-bold py-3 px-4 rounded-xl border border-[#FDE68A] transition-colors shadow-xs"
              >
                <MessageSquarePlus className="w-4 h-4 text-[#B45309]" />
                <span>Rate & Review</span>
              </button>

              <a
                href={telUrl}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] text-xs font-bold py-3 px-4 rounded-xl border border-[#D6CDC0] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#0F5132]" />
                <span>Call ({farmer.phone})</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4 fill-current text-[#10B981]" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="px-6 md:px-8 pb-8 pt-4 border-t border-[#E8E2D9] space-y-2">
            <h3 className="font-bold text-sm text-[#111827]">About Agricultural Operations</h3>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              {farmer.bio || 'Registered Benue agricultural producer providing bulk and retail produce listings.'}
            </p>
          </div>
        </div>

        {/* Active Listings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xl text-[#0F5132]">
              Active Listings by {farmer.name} ({farmerListings.length})
            </h2>
          </div>

          {farmerListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {farmerListings.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl border border-[#E8E2D9] text-center text-xs text-[#4B5563]">
              This farmer currently has no active public produce listings.
            </div>
          )}
        </div>

        {/* Buyer Reviews & Rating Feedback Section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div>
              <h3 className="font-extrabold text-xl text-[#111827] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Buyer Reviews & Ratings ({sellerReviews.length})</span>
              </h3>
              <p className="text-xs text-[#4B5563]">
                Feedback submitted by verified off-takers and foodstuff merchants
              </p>
            </div>

            <button
              onClick={() => setIsRatingModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#FEF3C7]" />
              <span>Write a Review</span>
            </button>
          </div>

          {sellerReviews.length > 0 ? (
            <div className="space-y-4">
              {sellerReviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0F5132] text-white font-bold text-xs flex items-center justify-center">
                        {rev.reviewerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#111827]">{rev.reviewerName}</h4>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#4B5563] leading-relaxed italic pt-1">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#4B5563] space-y-2">
              <p>No buyer reviews written for this seller yet.</p>
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="text-xs font-bold text-[#0F5132] hover:underline"
              >
                Be the first to rate & review {farmer.name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

