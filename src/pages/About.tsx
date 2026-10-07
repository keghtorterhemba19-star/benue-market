import React from 'react';
import { Link } from 'react-router-dom';
import { BENUE_LGAS } from '../constants/benue';

export const About: React.FC = () => {
  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-16">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider bg-[#FEF3C7] px-3 py-1 rounded-full border border-[#FDE68A]">
            About Benue Market
          </span>
          <h1 className="font-extrabold text-3xl md:text-4xl text-[#111827] tracking-tight">
            Connecting Benue's Agricultural Heartland
          </h1>
          <p className="text-sm md:text-base text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Benue State is famously celebrated as the <strong>"Food Basket of the Nation"</strong>. Benue Market bridges the digital commerce gap between verified local farmers and buyers nationwide.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F5132] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🎯
            </div>
            <h3 className="font-extrabold text-lg text-[#111827]">Our Mission</h3>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              To empower every smallholder farmer, cooperative, and produce aggregator in Benue State by giving them direct visibility to grain merchants, food processors, and consumer buyers without intermediary broker markups.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#B45309] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🌟
            </div>
            <h3 className="font-extrabold text-lg text-[#111827]">Direct Connection Model</h3>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              We operate on a <strong>Direct Farmgate Model</strong>. Buyers connect with farmers via direct Phone Call or structured WhatsApp chats. Zero commissions, zero fees, zero escrow lockups.
            </p>
          </div>
        </div>

        {/* Coverage LGAs */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
          <h3 className="font-extrabold text-xl text-[#0F5132]">
            Coverage Across All 23 Benue LGAs
          </h3>
          <p className="text-xs text-[#4B5563]">
            Our platform connects agricultural trade hubs in all 23 local government areas:
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {BENUE_LGAS.map((lga) => (
              <span
                key={lga.name}
                className="text-xs font-semibold bg-[#E8F5E9] text-[#0F5132] px-3 py-1 rounded-full border border-[#C8E6C9]"
              >
                {lga.name} ({lga.majorMarket})
              </span>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-[#0F5132] text-white p-8 rounded-2xl text-center space-y-4 shadow-md border border-[#184E33]">
          <h2 className="font-extrabold text-2xl text-white">Ready to Start Trading in Benue?</h2>
          <p className="text-xs md:text-sm text-[#D1D5DB]">
            Browse fresh harvest listings or list your farm produce for free today.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              to="/browse"
              className="bg-[#F59E0B] text-[#08291B] font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#D97706] shadow-sm transition-colors"
            >
              Browse Produce
            </Link>
            <Link
              to="/sell-produce"
              className="bg-[#08291B] text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#0B3D26] border border-white/20 transition-colors"
            >
              List Produce
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
