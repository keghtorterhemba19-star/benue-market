import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { PRODUCE_CATEGORIES } from '../../constants/benue';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#08291B] text-[#E5E7EB] pt-16 pb-8 border-t border-[#184E33]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#184E33]">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 w-fit">
              <img
                src="/logo.png"
                alt="Benue Market Logo"
                className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg border border-white/15"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white leading-none">
                  Benue Market
                </span>
                <span className="text-[11px] text-[#F59E0B] font-bold tracking-wider mt-0.5">
                  Direct Farmgate Commerce
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#D1D5DB] leading-relaxed max-w-md">
              Benue Market connects verified local farmers and cooperatives across all 23 LGAs of Benue State directly with grain merchants, bulk food aggregators, and buyers across Nigeria.
            </p>

            <div className="flex items-center gap-2.5 text-xs text-[#E5E7EB] bg-[#0E3D29] px-3 py-2 rounded-lg w-fit border border-[#184E33]">
              <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>Zero Middlemen • Zero Commissions • Direct Trade</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#F59E0B] uppercase tracking-wider">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm text-[#D1D5DB]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">Browse Harvests</Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-white transition-colors">Farmers Directory</Link>
              </li>
              <li>
                <Link to="/sell-produce" className="hover:text-white transition-colors">List Produce</Link>
              </li>
              <li>
                <Link to="/buyer-dashboard" className="hover:text-white transition-colors">Saved Items</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#F59E0B] uppercase tracking-wider">
              Key Produce
            </h4>
            <ul className="space-y-2 text-sm text-[#D1D5DB]">
              {PRODUCE_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/browse?category=${cat.id}`}
                    className="hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{cat.name}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Agricultural Hubs */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#F59E0B] uppercase tracking-wider">
              Major Trade Hubs
            </h4>
            <ul className="space-y-2 text-xs text-[#D1D5DB]">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>Zaki Biam Yam Market (Ukum)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>Gboko Rice Mill Center</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>Wadata Market (Makurdi)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>Otukpo Grain Hub</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>Adikpo Grain Market (Kwande)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <p>© {new Date().getFullYear()} Benue Market. Built for Benue State Agriculture.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
            <span className="text-[#F59E0B] font-semibold">Benue State, Nigeria 🇳🇬</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
