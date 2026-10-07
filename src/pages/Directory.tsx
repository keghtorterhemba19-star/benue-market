import React, { useState } from 'react';
import { Search, MapPin, ShieldCheck, Users } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';
import { BENUE_LGAS } from '../constants/benue';
import { FarmerCard } from '../components/marketplace/FarmerCard';
import type { BenueLGA } from '../types';

export const Directory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLga, setSelectedLga] = useState<BenueLGA | 'all'>('all');

  const farmers = MOCK_USERS.filter((user) => user.role === 'seller');

  const filteredFarmers = farmers.filter((farmer) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = farmer.name.toLowerCase().includes(q);
      const matchBio = (farmer.bio || '').toLowerCase().includes(q);
      const matchLocation = (farmer.location || '').toLowerCase().includes(q);
      if (!matchName && !matchBio && !matchLocation) return false;
    }
    if (selectedLga !== 'all' && farmer.lga !== selectedLga) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
              Verified Producers Directory
            </span>
            <h1 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight">
              Benue Farmers & Cooperatives Directory
            </h1>
            <p className="text-xs md:text-sm text-[#4B5563]">
              Connect directly with verified agricultural growers, grain merchants, and livestock farmers across Benue's 23 LGAs.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#E8F5E9] p-4 rounded-xl border border-[#C8E6C9] text-xs text-[#0F5132] font-bold">
            <ShieldCheck className="w-6 h-6 shrink-0" />
            <div>
              <span>Verified Benue Producers</span>
              <p className="text-[11px] text-[#4B5563] font-normal">Direct farmgate trading</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="w-5 h-5 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search farmer or cooperative name, produce type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          <div className="md:col-span-4 flex items-center bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl px-3 py-2">
            <MapPin className="w-4 h-4 text-[#0F5132] mr-2 shrink-0" />
            <select
              value={selectedLga}
              onChange={(e) => setSelectedLga(e.target.value as any)}
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
        </div>

        {/* Farmers Grid */}
        {filteredFarmers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarmers.map((farmer) => (
              <FarmerCard key={farmer.id} farmer={farmer} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center space-y-3 max-w-md mx-auto shadow-sm">
            <Users className="w-12 h-12 text-[#0F5132] mx-auto" />
            <h3 className="font-bold text-lg text-[#111827]">No Farmers Found</h3>
            <p className="text-xs text-[#4B5563]">No registered Benue farmer matches your current search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
