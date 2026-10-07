import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, ShieldCheck, ArrowRight, Star, Calendar } from 'lucide-react';
import type { User } from '../../types';
import { generateWhatsappLink, generateTelLink } from '../../utils/formatters';

interface FarmerCardProps {
  farmer: User;
}

export const FarmerCard: React.FC<FarmerCardProps> = ({ farmer }) => {
  const telUrl = generateTelLink(farmer.phone);
  const whatsappUrl = generateWhatsappLink(
    farmer.whatsapp || farmer.phone,
    farmer.name,
    'Produce Catalog',
    0,
    'Trade Batch'
  );

  const joinedYearMonth = farmer.createdAt
    ? new Date(farmer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2024';

  const isAvailable = farmer.availabilityStatus !== 'away';
  const rating = farmer.averageRating || 4.8;
  const reviewCount = farmer.reviewCount || 12;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative">
      {/* Top Header */}
      <div className="flex items-start gap-3.5">
        <div className="relative w-12 h-12 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-lg ring-2 ring-[#C8E6C9] shrink-0 overflow-hidden">
          {farmer.profileImage ? (
            <img src={farmer.profileImage} alt={farmer.name} className="w-full h-full object-cover" />
          ) : (
            farmer.name.charAt(0)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold text-base text-[#111827] truncate">{farmer.name}</h3>
              {farmer.isVerified && (
                <ShieldCheck className="w-4 h-4 text-[#0F5132] shrink-0" />
              )}
            </div>

            {/* Status Badge */}
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#10B981] animate-pulse' : 'bg-amber-600'}`} />
              <span>{isAvailable ? 'Available' : 'Away'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#4B5563] mt-0.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
            <span className="truncate">{farmer.location || `${farmer.lga} LGA`}</span>
          </div>

          {/* Rating & Joined Date Row */}
          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#4B5563]">
            <span className="flex items-center gap-1 font-bold text-[#B45309]">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              <span>{rating} ({reviewCount})</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-gray-500">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span>Joined {joinedYearMonth}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] uppercase font-extrabold bg-[#E8F5E9] text-[#0F5132] px-2 py-0.5 rounded border border-[#C8E6C9]">
              {farmer.userType || 'Farmer'}
            </span>
            <span className="text-xs text-[#B45309] font-bold">
              {farmer.completedTradesCount || 12}+ Trades
            </span>
          </div>
        </div>
      </div>

      {/* Bio / Summary */}
      <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
        {farmer.bio || 'Registered agricultural produce seller and harvest producer in Benue State.'}
      </p>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#E8E2D9] grid grid-cols-3 gap-2">
        <a
          href={telUrl}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#0F5132] border border-[#D6CDC0] transition-colors text-xs font-bold active:scale-95"
          title="Call Farmer"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>Call</span>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white transition-colors text-xs font-bold active:scale-95"
          title="WhatsApp Farmer"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-current text-[#10B981] shrink-0" />
          <span>Chat</span>
        </a>

        <Link
          to={`/farmer/${farmer.id}`}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#0F5132] border border-[#C8E6C9] transition-colors text-xs font-bold active:scale-95"
        >
          <span>Profile</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
};

