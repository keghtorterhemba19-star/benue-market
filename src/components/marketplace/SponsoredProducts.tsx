import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, MapPin, ShieldCheck, ArrowRight, Sparkles, Phone, MessageSquare } from 'lucide-react';
import type { Advertisement } from '../../types/advertisement';
import { fetchActiveAdvertisements } from '../../services/advertisingService';
import { useProducts } from '../../context/ProductContext';
import { formatNaira, generateWhatsappLink } from '../../utils/formatters';
import { ContactSellerModal } from './ContactSellerModal';
import type { Product } from '../../types';

export const SponsoredProducts: React.FC = () => {
  const [sponsoredAds, setSponsoredAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getProductById } = useProducts();
  const [contactProduct, setContactProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadSponsoredProducts();
  }, []);

  const loadSponsoredProducts = async () => {
    setIsLoading(true);
    try {
      const ads = await fetchActiveAdvertisements();
      setSponsoredAds(ads);
    } catch {
      setSponsoredAds([]);
    }
    setIsLoading(false);
  };

  // Match ads to actual products from context for full data
  const sponsoredItems = sponsoredAds
    .map((ad) => {
      const product = getProductById(ad.productId);
      return product ? { ad, product } : null;
    })
    .filter((item): item is { ad: Advertisement; product: Product } => item !== null);

  if (isLoading || sponsoredItems.length === 0) return null;

  return (
    <>
      <section className="w-full py-14 border-b border-[#E8E2D9] bg-gradient-to-b from-[#FFFBEB]/40 to-[#FBF9F6]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 w-fit mb-2">
                <Megaphone className="w-3.5 h-3.5 text-[#B45309]" />
                <span className="text-xs font-extrabold text-[#B45309] uppercase tracking-wider">
                  Sponsored Produce
                </span>
                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
              </div>
              <h2 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight mt-1">
                Promoted Harvest Listings
              </h2>
              <p className="text-sm text-[#4B5563] mt-1">
                Premium advertised products from verified Benue farmers and cooperatives
              </p>
            </div>

            <Link
              to="/browse"
              className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <span>Browse All Produce</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Sponsored Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sponsoredItems.slice(0, 8).map(({ ad, product }) => (
              <article
                key={ad.id}
                className="group relative bg-white rounded-2xl border border-amber-200/60 overflow-hidden shadow-sm hover:shadow-lg hover:border-amber-300 transition-all duration-200"
              >
                {/* Sponsored Badge */}
                <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0F5132] text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider">
                  <Megaphone className="w-3 h-3" />
                  <span>Sponsored</span>
                </div>

                {/* Product Image */}
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[4/3] bg-[#F4EFEB] overflow-hidden">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* LGA Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-[#E8E2D9] shadow-sm z-10">
                      <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
                      <span className="text-xs font-bold text-[#0F5132]">{product.lga}</span>
                    </div>
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4 space-y-2">
                  {/* Seller */}
                  <div className="flex items-center gap-1.5">
                    {product.isVerifiedSeller && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                    )}
                    <span className="text-xs font-semibold text-[#4B5563] truncate">{product.sellerName}</span>
                  </div>

                  {/* Product Name */}
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#0F5132] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-extrabold text-lg text-[#0F5132]">
                        {formatNaira(product.price)}
                      </span>
                      <span className="text-xs text-[#4B5563] ml-1">/ {product.unit}</span>
                    </div>
                    <span className="text-xs font-bold text-[#B45309]">{product.quantity} avail</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setContactProduct(product)}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#F4EFEB] hover:bg-[#E8E2D9] text-[#111827] text-xs font-bold py-2 px-3 rounded-lg border border-[#E8E2D9] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#0F5132]" />
                      <span>Call</span>
                    </button>
                    <a
                      href={generateWhatsappLink(product.sellerWhatsapp || product.sellerPhone, product.sellerName, product.name, product.price, product.unit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Seller Modal */}
      {contactProduct && (
        <ContactSellerModal
          isOpen={!!contactProduct}
          onClose={() => setContactProduct(null)}
          sellerName={contactProduct.sellerName}
          sellerPhone={contactProduct.sellerPhone}
          sellerWhatsapp={contactProduct.sellerWhatsapp}
          sellerLocation={contactProduct.location}
          sellerLga={contactProduct.lga}
          productName={contactProduct.name}
          productPrice={contactProduct.price}
          productUnit={contactProduct.unit}
          isVerified={contactProduct.isVerifiedSeller}
        />
      )}
    </>
  );
};
