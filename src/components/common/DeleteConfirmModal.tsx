import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import type { Product } from '../../types';
import { formatNaira } from '../../utils/formatters';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (productId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !product) return null;

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onConfirmDelete(product.id);
      setIsDeleting(false);
      onClose();
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="relative bg-white w-full max-w-md rounded-2xl border border-[#E8E2D9] shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Decorator Bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
          title="Close dialog (Esc)"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header Icon & Title */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Delete Harvest Listing</span>
              </span>
              <h3 id="delete-modal-title" className="font-extrabold text-xl text-[#111827]">
                Remove this product?
              </h3>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="bg-[#FBF9F6] p-3.5 rounded-xl border border-[#E8E2D9] flex items-center gap-3">
            <img
              src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=300'}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover border border-[#E8E2D9] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-[#111827] truncate">{product.name}</h4>
              <p className="text-xs font-extrabold text-[#0F5132] truncate mt-0.5">
                {formatNaira(product.price)} <span className="font-medium text-[#6B7280]">/ {product.unit}</span>
              </p>
              <p className="text-[11px] text-[#4B5563] truncate mt-0.5">
                📍 {product.location} • {product.lga} LGA
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-2.5 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This will permanently unlist your produce from the Benue Marketplace. Buyers will no longer be able to call, WhatsApp, or search for this item.
            </span>
          </div>

          {/* Modal Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full py-2.5 px-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold rounded-xl border border-[#D6CDC0] transition-colors disabled:opacity-50"
            >
              Cancel / Keep
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Listing</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
