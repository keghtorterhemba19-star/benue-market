import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, Heart, MapPin, CheckCircle, Camera, Trash2, Star } from 'lucide-react';
import type { Product } from '../../types';
import { formatNaira, generateWhatsappLink } from '../../utils/formatters';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { ContactSellerModal } from './ContactSellerModal';

interface ProductCardProps {
  product: Product;
}

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600';

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isProductSaved, toggleSaveProduct, deleteProduct } = useProducts();
  const { currentUser } = useAuth();
  const saved = isProductSaved(product.id);
  const isOwner = currentUser?.id === product.sellerId;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const cardImage = (product.images && product.images.length > 0)
    ? product.images[0]
    : FALLBACK_PRODUCT_IMAGE;

  const [imageError, setImageError] = useState(false);
  const displaySrc = imageError ? FALLBACK_PRODUCT_IMAGE : cardImage;
  const totalPhotos = product.images?.length || 0;

  const whatsappUrl = generateWhatsappLink(
    product.sellerWhatsapp || product.sellerPhone,
    product.sellerName,
    product.name,
    product.price,
    product.unit
  );

  return (
    <article className="group bg-white rounded-xl border border-[#E8E2D9] overflow-hidden shadow-xs hover:border-[#9CA3AF] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Upper Container: Image & Badges */}
      <div className="relative aspect-[4/3] bg-[#F4EFEB] overflow-hidden">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={displaySrc}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Top Overlay: LGA Pill */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-[#E8E2D9] pointer-events-none z-10 shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
          <span className="text-xs font-bold text-[#0F5132]">
            {product.lga} LGA
          </span>
        </div>

        {/* Top Overlay: Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {isOwner && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
              title="Delete your produce listing"
              aria-label="Delete listing"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSaveProduct(product.id);
            }}
            className={`p-1.5 rounded-md backdrop-blur-md transition-colors ${
              saved
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'bg-white/90 text-[#4B5563] hover:text-[#0F5132] border border-[#E8E2D9]'
            }`}
            title={saved ? 'Remove from Saved' : 'Save Produce'}
            aria-label={saved ? 'Remove from saved' : 'Save produce'}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <DeleteConfirmModal
          product={product}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirmDelete={(prodId) => deleteProduct(prodId)}
        />

        {/* Photo Count Badge - hints at more photos on detail page */}
        {totalPhotos > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 z-10">
            <Camera className="w-3 h-3 text-[#FEF3C7]" />
            <span>{totalPhotos} photos</span>
          </div>
        )}

        {/* Location Badge */}
        <div className="absolute bottom-3 left-3 bg-[#0F5132] text-white text-xs font-bold px-2.5 py-0.5 rounded shadow-xs z-10">
          {product.location}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div>
          {/* Seller Verified Header & Star Rating */}
          <div className="flex items-center justify-between text-xs text-[#374151] mb-1.5">
            <span className="flex items-center gap-1 font-semibold text-[#0F5132]">
              <CheckCircle className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
              <span className="truncate max-w-[130px]">{product.sellerName}</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-[#B45309] flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <span>4.8</span>
              </span>
              <span className="text-xs bg-[#E8F5E9] text-[#0F5132] px-2 py-0.5 rounded font-bold border border-[#C8E6C9]">
                Min: {product.minimumOrder}
              </span>
            </div>
          </div>


          {/* Product Name */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-[#0F5132] transition-colors">
            <h3 className="font-bold text-base text-[#111827] line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-[#4B5563] line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Block */}
        <div className="pt-2.5 border-t border-[#E8E2D9] flex items-baseline justify-between">
          <div>
            <span className="font-extrabold text-lg md:text-xl text-[#0F5132] tracking-tight">
              {formatNaira(product.price)}
            </span>
            <span className="text-xs text-[#4B5563] ml-1 font-medium">
              / {product.unit}
            </span>
          </div>
          <span className="text-xs font-bold text-[#B45309]">
            {product.quantity} Available
          </span>
        </div>

        {/* Action Footer (Direct Call & WhatsApp) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-[#F4EFEB] hover:bg-[#E8E2D9] text-[#111827] text-xs font-bold py-2 px-2.5 rounded-lg border border-[#E8E2D9] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>Call Seller</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
              setIsContactModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold py-2 px-2.5 rounded-lg shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </button>
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
      </div>
    </article>
  );
};
