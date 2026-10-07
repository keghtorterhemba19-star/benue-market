import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, Heart, ShieldCheck, ArrowLeft, Trash2, Edit3, CheckCircle2, Flag, Star, Calendar, Eye } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { formatNaira, generateWhatsappLink } from '../utils/formatters';
import { ProductCard } from '../components/marketplace/ProductCard';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { ContactSellerModal } from '../components/marketplace/ContactSellerModal';
import { EditProductModal } from '../components/marketplace/EditProductModal';
import { ReportModal } from '../components/common/ReportModal';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, products, isProductSaved, toggleSaveProduct, deleteProduct, trackRecentlyViewed, recentlyViewedProducts } = useProducts();
  const { currentUser, getUserById } = useAuth();

  const product = getProductById(id || '');
  const seller = product ? getUserById(product.sellerId) : undefined;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product?.id) {
      trackRecentlyViewed(product.id);
    }
  }, [product?.id, trackRecentlyViewed]);

  if (!product) {
    return (
      <div className="w-full bg-[#FBF9F6] min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#E8E2D9] text-center space-y-4 max-w-md shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#0F5132] font-bold text-2xl flex items-center justify-center mx-auto">
            🌾
          </div>
          <h2 className="font-bold text-xl text-[#111827]">Product Listing Not Found</h2>
          <p className="text-xs text-[#4B5563]">
            The requested produce item might have been unlisted by the farmer or removed.
          </p>
          <button
            onClick={() => navigate('/browse')}
            className="inline-flex items-center gap-2 bg-[#0F5132] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#0B3D26] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === product.sellerId;
  const saved = isProductSaved(product.id);
  const otherProductsFromSeller = products.filter(
    (p) => p.sellerId === product.sellerId && p.id !== product.id
  );

  const filteredRecentlyViewed = recentlyViewedProducts.filter((p) => p.id !== product.id);

  const joinedDate = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2024';

  const isAvailable = seller?.availabilityStatus !== 'away';
  const rating = seller?.averageRating || 4.9;
  const reviewCount = seller?.reviewCount || 18;

  const handleDeleteConfirm = (productId: string) => {
    deleteProduct(productId);
    navigate('/browse');
  };

  const whatsappUrl = generateWhatsappLink(
    product.sellerWhatsapp || product.sellerPhone,
    product.sellerName,
    product.name,
    product.price,
    product.unit
  );

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F5132] text-white px-4 py-3 rounded-xl shadow-lg border border-[#C8E6C9]/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="product"
        targetId={product.id}
        targetName={product.name}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={product}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDeleteConfirm}
      />

      {/* Edit Produce Modal */}
      <EditProductModal
        product={product}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={(updated) => {
          setToastMessage(`"${updated.name}" updated successfully.`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* Navigation & Owner Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0F5132] hover:text-[#0B3D26] bg-white px-3.5 py-2 rounded-xl border border-[#D6CDC0] shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Produce List</span>
          </button>

          <div className="flex items-center gap-2">
            {!isOwner && currentUser?.role !== 'seller' && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl border border-red-200 transition-colors shadow-xs"
                title="Report fake product or fraud"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Item</span>
              </button>
            )}

            {isOwner && (
              <div className="flex items-center gap-2 bg-emerald-50 p-1.5 px-3 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-[#0F5132] hidden sm:inline">Publisher Controls:</span>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                  title="Edit listing details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Edit Listing</span>
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                  title="Delete listing"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Product Container */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F3F4F6] border border-[#E8E2D9]">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleSaveProduct(product.id)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-sm transition-transform active:scale-90 ${
                  saved
                    ? 'bg-[#B45309] text-white shadow-md'
                    : 'bg-white/90 text-[#4B5563] hover:text-[#0F5132] shadow-sm'
                }`}
                title={saved ? 'Remove from Saved' : 'Save Produce'}
              >
                <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail switcher if multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx ? 'border-[#0F5132] ring-2 ring-[#C8E6C9]' : 'border-[#E8E2D9] opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Specs & Direct Seller Contact */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & LGA Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase bg-[#E8F5E9] text-[#0F5132] px-3 py-1 rounded-full border border-[#C8E6C9]">
                  {product.category}
                </span>
                <span className="text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-3 py-1 rounded-full flex items-center gap-1 border border-[#FDE68A]">
                  <MapPin className="w-3.5 h-3.5" />
                  {product.lga} LGA • {product.location}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-extrabold text-2xl md:text-3xl text-[#111827]">
                {product.name}
              </h1>

              {/* Price & Unit */}
              <div className="bg-[#FBF9F6] p-4 rounded-xl border border-[#E8E2D9] space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-3xl text-[#0F5132]">
                    {formatNaira(product.price)}
                  </span>
                  <span className="text-sm text-[#4B5563] font-medium">
                    / {product.unit}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#B45309] pt-1 font-semibold">
                  <span>Available: <strong>{product.quantity}</strong></span>
                  <span>•</span>
                  <span>Minimum Order: <strong>{product.minimumOrder}</strong></span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-[#111827]">Produce Details</h4>
                <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Seller Information Box with Ratings, Status & Joined Date */}
              <div className="bg-[#E8F5E9] p-4.5 rounded-2xl border border-[#C8E6C9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F5132] uppercase">Producer / Seller Profile</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isAvailable
                          ? 'bg-white text-emerald-800 border-[#C8E6C9]'
                          : 'bg-[#FEF3C7] text-amber-800 border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#10B981] animate-pulse' : 'bg-amber-600'}`} />
                      <span>{isAvailable ? 'Available' : 'Away'}</span>
                    </span>

                    {product.isVerifiedSeller && (
                      <span className="text-[11px] font-bold text-[#0F5132] bg-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#C8E6C9]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="w-12 h-12 rounded-full bg-[#0F5132] text-white font-bold text-lg flex items-center justify-center shrink-0 ring-2 ring-white">
                    {product.sellerName.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <Link
                      to={`/farmer/${product.sellerId}`}
                      className="font-bold text-sm text-[#111827] hover:text-[#0F5132] transition-colors block"
                    >
                      {product.sellerName}
                    </Link>

                    {/* Star Rating & Joined Date */}
                    <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                      <span className="flex items-center gap-1 font-bold text-[#B45309]">
                        <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                        <span>{rating} ({reviewCount} reviews)</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>Joined {joinedDate}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#4B5563] pt-0.5">{product.location}, {product.lga} LGA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons or Owner Management */}
            {isOwner ? (
              <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Listing Management
                    </span>
                    <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Your Listing
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    You published this harvest listing to the Benue Marketplace. You can delete or unlist it at any time.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Edit Listing Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete This Listing</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
                <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider block text-center">
                  Contact Seller Directly to Trade
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] text-xs sm:text-sm font-bold py-3.5 px-3 rounded-xl border border-[#D6CDC0] transition-colors shadow-sm active:scale-95"
                  >
                    <Phone className="w-4 h-4 text-[#0F5132] shrink-0" />
                    <span>Call Seller</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                      setIsContactModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs sm:text-sm font-bold py-3.5 px-3 rounded-xl shadow-sm transition-colors active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 fill-current text-[#10B981] shrink-0" />
                    <span>WhatsApp Deal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Seller Modal */}
        <ContactSellerModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          sellerName={product.sellerName}
          sellerPhone={product.sellerPhone}
          sellerWhatsapp={product.sellerWhatsapp}
          sellerLocation={product.location}
          sellerLga={product.lga}
          productName={product.name}
          productPrice={product.price}
          productUnit={product.unit}
          isVerified={product.isVerifiedSeller}
        />

        {/* More Produce From Seller Section */}
        {otherProductsFromSeller.length > 0 && (
          <div className="space-y-6 pt-6">
            <h3 className="font-extrabold text-xl text-[#0F5132]">
              More Produce from {product.sellerName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProductsFromSeller.slice(0, 3).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Produce Section */}
        {filteredRecentlyViewed.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-[#E8E2D9]">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xl text-[#111827] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#0F5132]" />
                <span>Recently Viewed Produce</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRecentlyViewed.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

