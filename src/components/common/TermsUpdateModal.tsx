import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CURRENT_TERMS_VERSION, TERMS_LAST_UPDATED } from '../../constants/legal';

export const TermsUpdateModal: React.FC = () => {
  const { currentUser, acceptTerms, termsAccepted } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // If not logged in, or already accepted current terms, do not render
  if (!currentUser || termsAccepted || !isOpen) {
    return null;
  }

  const handleAccept = async () => {
    setLoading(true);
    await acceptTerms(CURRENT_TERMS_VERSION);
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-lg overflow-hidden relative p-6 sm:p-8 space-y-5">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0F5132] flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
          <Scale className="w-7 h-7 text-[#0F5132]" />
        </div>

        <div className="text-center space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0F5132] bg-[#E8F5E9] px-3 py-1 rounded-full border border-[#C8E6C9]">
            Legal Document Update • v{CURRENT_TERMS_VERSION}
          </span>
          <h2 className="font-extrabold text-xl sm:text-2xl text-[#111827]">
            Updated Terms & Conditions
          </h2>
          <p className="text-xs text-[#4B5563] leading-relaxed max-w-sm mx-auto">
            We have updated Benue Market's operational terms and trade safety policies (Last updated: {TERMS_LAST_UPDATED}). Please review and accept to continue.
          </p>
        </div>

        {/* Key Highlights */}
        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D9] space-y-2.5 text-xs text-[#374151]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
            <p>
              <strong>Direct Trade (0% Commission):</strong> Connects buyers and farmers directly without online checkout, escrow fees, or platform transaction commissions.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
            <p>
              <strong>Truthful Listings & Pricing:</strong> Strict rules requiring accurate farmgate prices in Naira and authentic Benue State harvest descriptions.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
            <p>
              <strong>Promotions Policy:</strong> Transparent ₦2,000 Starter and ₦5,000 Growth 30-day visibility subscription options.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Recording Acceptance...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#FEAE3A]" />
                <span>I Explicitly Accept Updated Terms (v{CURRENT_TERMS_VERSION})</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <Link
              to="/terms"
              target="_blank"
              className="text-[#0F5132] font-bold hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read Full Legal Terms</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 font-medium"
            >
              Review Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
