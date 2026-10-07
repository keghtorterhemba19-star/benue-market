import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, ShieldCheck, MapPin, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import { PRODUCE_CATEGORIES } from '../constants/benue';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/marketplace/ProductCard';
import { CategoryCard } from '../components/marketplace/CategoryCard';
import { ContactSellerModal } from '../components/marketplace/ContactSellerModal';
import { SponsoredProducts } from '../components/marketplace/SponsoredProducts';
import { formatNaira, generateWhatsappLink } from '../utils/formatters';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { featuredProducts, products } = useProducts();
  const heroFeaturedItem = featuredProducts[0] || products[0];
  const [heroSearch, setHeroSearch] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/browse?search=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="w-full bg-[#FBF9F6]">
      {/* 1. Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-14 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headline & Search */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] w-fit">
              <span className="w-2 h-2 rounded-full bg-[#0F5132]"></span>
              <span className="text-xs text-[#0F5132] font-extrabold uppercase tracking-wide">
                Benue State Farmgate Network
              </span>
              <span className="text-[#374151] text-xs font-semibold">• 23 LGAs</span>
            </div>

            <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#111827] tracking-tight leading-[1.12]">
              Direct Farm Produce Marketplace for Benue State
            </h1>

            <p className="text-base sm:text-lg text-[#374151] max-w-2xl leading-relaxed">
              Connect directly with verified farmers, grain cooperatives, and livestock rearers across Benue. Transparent farm-gate pricing with zero middleman markups.
            </p>

            {/* Quick Hero Search Input */}
            <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search yams, soybeans, rice, citrus, livestock..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] shrink-0"
              >
                Find Harvest
              </button>
            </form>
          </div>

          {/* Right Column: Hero Spotlight Card */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-[#0F5132] uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
                Featured Harvest Batch
              </span>
              <Link to="/browse" className="text-xs font-bold text-[#B45309] hover:underline">
                View All Marketplace
              </Link>
            </div>

            {/* Single Large Spotlight Card */}
            {products[0] && (
              <article className="group bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-sm hover:border-[#9CA3AF] hover:shadow-lg transition-all duration-200">
                <Link to={`/product/${products[0].id}`} className="block">
                  <div className="relative aspect-[16/10] bg-[#F4EFEB] overflow-hidden">
                    <img
                      src={products[0].images?.[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800'}
                      alt={products[0].name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* LGA Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 border border-[#E8E2D9] shadow-sm z-10">
                      <MapPin className="w-4 h-4 text-[#0F5132]" />
                      <span className="text-sm font-bold text-[#0F5132]">{products[0].lga} LGA</span>
                    </div>
                    {/* Location Badge */}
                    <div className="absolute bottom-4 left-4 bg-[#0F5132] text-white text-sm font-bold px-3 py-1 rounded-lg shadow-sm z-10">
                      {products[0].location}
                    </div>
                  </div>
                </Link>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0F5132]">
                      <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
                      {products[0].sellerName}
                    </span>
                    <span className="text-xs bg-[#E8F5E9] text-[#0F5132] px-2.5 py-1 rounded-md font-bold border border-[#C8E6C9]">
                      Min: {products[0].minimumOrder}
                    </span>
                  </div>

                  <Link to={`/product/${products[0].id}`}>
                    <h3 className="font-bold text-lg text-[#111827] group-hover:text-[#0F5132] transition-colors">
                      {products[0].name}
                    </h3>
                  </Link>
                  <p className="text-sm text-[#4B5563] line-clamp-2 leading-relaxed">{products[0].description}</p>

                  <div className="pt-3 border-t border-[#E8E2D9] flex items-baseline justify-between">
                    <div>
                      <span className="font-extrabold text-2xl text-[#0F5132] tracking-tight">
                        {formatNaira(products[0].price)}
                      </span>
                      <span className="text-sm text-[#4B5563] ml-1 font-medium">/ {products[0].unit}</span>
                    </div>
                    <span className="text-sm font-bold text-[#B45309]">{products[0].quantity} Available</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setIsContactModalOpen(true); }}
                      className="inline-flex items-center justify-center gap-2 bg-[#F4EFEB] hover:bg-[#E8E2D9] text-[#111827] text-sm font-bold py-2.5 px-4 rounded-xl border border-[#E8E2D9] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#0F5132]" />
                      <span>Call Seller</span>
                    </button>
                    <a
                      href={generateWhatsappLink(products[0].sellerWhatsapp || products[0].sellerPhone, products[0].sellerName, products[0].name, products[0].price, products[0].unit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      {/* Hero Spotlight Contact Modal */}
      {heroFeaturedItem && (
        <ContactSellerModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          sellerName={heroFeaturedItem.sellerName}
          sellerPhone={heroFeaturedItem.sellerPhone}
          sellerWhatsapp={heroFeaturedItem.sellerWhatsapp}
          sellerLocation={heroFeaturedItem.location}
          sellerLga={heroFeaturedItem.lga}
          productName={heroFeaturedItem.name}
          productPrice={heroFeaturedItem.price}
          productUnit={heroFeaturedItem.unit}
          isVerified={heroFeaturedItem.isVerifiedSeller}
        />
      )}

      {/* 2. Popular Categories Section */}
      <section className="w-full bg-white py-14 border-y border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
                Agricultural Sectors
              </span>
              <h2 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight mt-1">
                Browse Benue Produce by Category
              </h2>
            </div>
            <Link
              to="/browse"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#0F5132] hover:text-[#0B3D26] transition-colors"
            >
              <span>View All Produce</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {PRODUCE_CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Sponsored / Promoted Products Section */}
      <SponsoredProducts />

      {/* 3. Featured Harvest Produce Section */}
      <section className="w-full py-14 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
              Recent Harvests
            </span>
            <h2 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight mt-1">
              Featured Produce Listings
            </h2>
          </div>

          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#0F5132] text-xs font-bold px-4 py-2.5 rounded-lg border border-[#C8E6C9] transition-colors"
          >
            <span>Explore All Listings ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. How It Works (Direct Farm Commerce) */}
      <section className="w-full bg-[#F3EFEA]/60 py-14 border-y border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
              Transparent Commerce
            </span>
            <h2 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight mt-1">
              How Benue Market Operates
            </h2>
            <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
              No middleman cuts, no payment holding fees. Connect directly with local farmers and grain dealers in 3 clear steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[#E8E2D9] text-center space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#0F5132] text-white font-extrabold text-base flex items-center justify-center mx-auto shadow-sm">
                1
              </div>
              <h3 className="font-bold text-base text-[#111827]">Locate Produce by LGA</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Filter fresh agricultural produce by category, price, or specific Benue LGA (Zaki Biam, Gboko, Makurdi, Otukpo, etc.).
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E8E2D9] text-center space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#B45309] text-white font-extrabold text-base flex items-center justify-center mx-auto shadow-sm">
                2
              </div>
              <h3 className="font-bold text-base text-[#111827]">Contact Farmer Directly</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                One tap connects you via direct mobile phone call or formatted WhatsApp session with produce quantity and price prefilled.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-[#E8E2D9] text-center space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#059669] text-white font-extrabold text-base flex items-center justify-center mx-auto shadow-sm">
                3
              </div>
              <h3 className="font-bold text-base text-[#111827]">Complete Farmgate Trade</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Agree on pickup location, transport logistics, and settlement directly with the seller. 100% free of platform commissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Farmer Call-To-Action Banner */}
      <section className="w-full py-14 max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-[#0F5132] rounded-2xl p-8 md:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-md border border-[#184E33]">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-extrabold text-[#F59E0B] uppercase tracking-wider bg-[#08291B] px-3 py-1 rounded-full border border-white/10">
              For Benue Farmers & Cooperatives
            </span>
            <h2 className="font-extrabold text-2xl md:text-3xl tracking-tight leading-tight text-white">
              Have Harvest to Sell in Benue?
            </h2>
            <p className="text-sm text-[#D1D5DB] leading-relaxed">
              List your white yams, soybeans, rice, citrus, or livestock on Benue Market today. Reach verified bulk buyers and aggregators across Nigeria for free.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to="/sell-produce"
              className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#08291B] text-sm font-extrabold px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-[#08291B]" />
              <span>List Your Harvest Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
