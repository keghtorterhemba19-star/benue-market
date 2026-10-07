import React, { useState } from 'react';
import { Phone, MessageSquare, Copy, Check, X, ShieldCheck, MapPin, Info, ExternalLink, Flag } from 'lucide-react';
import { formatNaira, formatInternationalPhone, generateWhatsappLink, generateTelLink } from '../../utils/formatters';
import { ReportModal } from '../common/ReportModal';
import { useAuth } from '../../context/AuthContext';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp?: string;
  sellerLocation?: string;
  sellerLga?: string;
  productName?: string;
  productPrice?: number;
  productUnit?: string;
  isVerified?: boolean;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  onClose,
  sellerName,
  sellerPhone,
  sellerWhatsapp,
  sellerLocation,
  sellerLga,
  productName,
  productPrice,
  productUnit,
  isVerified = true,
}) => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!isOpen) return null;

  const rawPhone = sellerWhatsapp || sellerPhone || '08031234567';
  const displayPhone = formatInternationalPhone(rawPhone);
  const telUrl = generateTelLink(rawPhone);
  const whatsappUrl = generateWhatsappLink(
    rawPhone,
    sellerName,
    productName || 'Produce Harvest',
    productPrice || 0,
    productUnit || 'Batch'
  );

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(rawPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType={productName ? 'product' : 'seller'}
        targetId={sellerName}
        targetName={productName || sellerName}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div
          className="relative bg-white w-full max-w-lg rounded-2xl border border-[#E4DDD3] shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Decorator Bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#115433] via-[#feae3a] to-[#25d366]"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#404942] hover:text-[#141e16] p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8 space-y-6">
            {/* Seller Profile Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-[#115433] text-white flex items-center justify-center font-extrabold text-2xl ring-4 ring-[#aff1c5] shrink-0 shadow-md">
                  {sellerName.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-xl text-[#141e16]">{sellerName}</h3>
                    {isVerified && (
                      <ShieldCheck className="w-5 h-5 text-[#115433] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#404942] flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#115433]" />
                    <span>{sellerLocation || 'Market Hub'}, {sellerLga ? `${sellerLga} LGA` : 'Benue State'}</span>
                  </p>
                </div>
              </div>

              {/* Report Seller Button (Buyers Only) */}
              {currentUser?.role !== 'seller' && (
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors flex items-center gap-1 shrink-0"
                  title="Report Scam, Fake products or Violation"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              )}
            </div>

            {/* Listing Context Box (If available) */}
            {productName && (
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E4DDD3] space-y-1">
                <span className="text-[11px] font-bold text-[#855400] uppercase tracking-wider block">
                  Inquiring About Item
                </span>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#141e16] truncate">{productName}</h4>
                  {productPrice && productPrice > 0 && (
                    <span className="font-extrabold text-xs text-[#003b21] shrink-0">
                      {formatNaira(productPrice)} / {productUnit}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Seller Direct Phone Number & One-Click Copy */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#141e16] block">
                Seller Direct Phone & WhatsApp Number
              </label>
              <div className="flex items-center gap-2 bg-emerald-50/60 p-3 rounded-xl border border-[#c0c9bf]">
                <div className="flex-1 font-mono text-base font-extrabold text-[#003b21] tracking-wide">
                  {displayPhone}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-[#ebf7ea] text-[#115433] text-xs font-bold px-3 py-2 rounded-lg border border-[#E4DDD3] shadow-sm transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#25d366]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Triggers: WhatsApp & Direct Phone Call */}
            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#1fbd59] text-white text-sm font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>Open WhatsApp Chat Now</span>
                <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
              </a>

              <a
                href={telUrl}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#f3efea] hover:bg-[#e5f1e4] text-[#141e16] text-sm font-bold py-3.5 px-4 rounded-xl border border-[#E4DDD3] transition-colors"
              >
                <Phone className="w-5 h-5 text-[#115433]" />
                <span>Call Seller Directly ({rawPhone})</span>
              </a>
            </div>

            {/* Information & Troubleshooting Guidance */}
            <div className="flex items-start gap-2.5 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Troubleshooting Tip:</strong> If WhatsApp displays a registration notice because the seller uses a regular mobile line, call the seller directly or save <strong>{rawPhone}</strong> to your phone contacts first.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

