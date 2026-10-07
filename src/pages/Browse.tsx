import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, MapPin, X } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/marketplace/ProductCard';
import { BENUE_LGAS, PRODUCE_CATEGORIES } from '../constants/benue';
import type { BenueLGA, CategoryType } from '../types';

export const Browse: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { filter, setFilter, filteredProducts, resetFilters } = useProducts();

  // URL query param syncing
  useEffect(() => {
    const categoryParam = searchParams.get('category') as CategoryType | null;
    const lgaParam = searchParams.get('lga') as BenueLGA | null;
    const searchParam = searchParams.get('search');

    if (categoryParam) {
      setFilter((prev) => ({ ...prev, category: categoryParam }));
    }
    if (lgaParam) {
      setFilter((prev) => ({ ...prev, lga: lgaParam }));
    }
    if (searchParam) {
      setFilter((prev) => ({ ...prev, searchQuery: searchParam }));
    }
  }, [searchParams, setFilter]);

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309] uppercase tracking-wider mb-1">
              <span>Benue Agricultural Hub</span>
            </div>
            <h1 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight">
              Browse Produce Across Benue State
            </h1>
            <p className="text-xs md:text-sm text-[#4B5563] mt-1">
              Showing <strong className="text-[#111827]">{filteredProducts.length}</strong> verified produce listings with direct farmer contact details.
            </p>
          </div>

          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5132] hover:text-[#0B3D26] bg-[#E8F5E9] hover:bg-[#C8E6C9] border border-[#C8E6C9] px-3.5 py-2 rounded-lg transition-colors w-fit shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

        {/* Filter Bar & Search Inputs */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search produce name, description, farmer, or market (e.g. White Yam, Zaki Biam, Soybeans)..."
              value={filter.searchQuery}
              onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-11 pr-10 py-3 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 transition-all"
            />
            {filter.searchQuery && (
              <button
                onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] p-1"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setFilter((prev) => ({ ...prev, category: 'all' }))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                filter.category === 'all'
                  ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-sm'
                  : 'bg-[#F9FAFB] text-[#374151] border-[#E8E2D9] hover:bg-[#F3F4F6]'
              }`}
            >
              All Produce
            </button>
            {PRODUCE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter((prev) => ({ ...prev, category: cat.id }))}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  filter.category === cat.id
                    ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-sm'
                    : 'bg-[#F9FAFB] text-[#374151] border-[#E8E2D9] hover:bg-[#F3F4F6]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* LGA & Sorting Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E8E2D9]">
            {/* LGA Selector */}
            <div className="flex items-center bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-[#0F5132] mr-2 shrink-0" />
              <select
                value={filter.lga}
                onChange={(e) => setFilter((prev) => ({ ...prev, lga: e.target.value as any }))}
                className="bg-transparent text-xs font-bold text-[#111827] focus:outline-none w-full cursor-pointer"
              >
                <option value="all">All 23 Benue LGAs</option>
                {BENUE_LGAS.map((lga) => (
                  <option key={lga.name} value={lga.name}>
                    {lga.name} LGA ({lga.majorMarket})
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-[#B45309] mr-2 shrink-0" />
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                className="bg-transparent text-xs font-bold text-[#111827] focus:outline-none w-full cursor-pointer"
              >
                <option value="recent">Sort by: Recently Listed</option>
                <option value="price_low">Sort by: Price (Low to High)</option>
                <option value="price_high">Sort by: Price (High to Low)</option>
              </select>
            </div>

            {/* Stock filter toggle */}
            <label className="flex items-center justify-between sm:justify-center gap-2 bg-[#E8F5E9] px-3.5 py-2 rounded-xl border border-[#C8E6C9] cursor-pointer">
              <span className="text-xs font-bold text-[#0F5132]">In Stock Only</span>
              <input
                type="checkbox"
                checked={filter.availabilityOnly}
                onChange={(e) => setFilter((prev) => ({ ...prev, availabilityOnly: e.target.checked }))}
                className="w-4 h-4 text-[#0F5132] accent-[#0F5132] focus:ring-[#0F5132] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#0F5132] font-extrabold text-2xl flex items-center justify-center mx-auto">
              🌾
            </div>
            <h3 className="font-extrabold text-xl text-[#111827]">No Produce Matches Found</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              No Benue harvest listings match your current search or filter criteria. Try choosing another LGA or resetting your filters.
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
