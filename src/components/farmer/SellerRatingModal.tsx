import React, { useState } from 'react';
import { X, Star, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SellerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  onReviewAdded?: () => void;
}

export const SellerRatingModal: React.FC<SellerRatingModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  onReviewAdded,
}) => {
  const { addSellerReview, currentUser } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError('Please share a short comment about your trade experience with this producer.');
      return;
    }

    setLoading(true);
    try {
      await addSellerReview(sellerId, rating, comment);
      setIsSuccess(true);
      if (onReviewAdded) onReviewAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setHoverRating(0);
    setComment('');
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#0F5132] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FEF3C7]">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Rate & Review Farmer</h3>
              <p className="text-xs text-[#C8E6C9] truncate max-w-[220px]">{sellerName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-5">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h4 className="font-extrabold text-lg text-[#111827]">Review Published!</h4>
              <p className="text-xs text-[#4B5563]">
                Your feedback for <strong>{sellerName}</strong> has been added to their agricultural profile.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-2">
                <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
                  Select Star Rating
                </span>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            active
                              ? 'text-[#F59E0B] fill-[#F59E0B]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-[#B45309]">
                  {rating === 5 && '🌟 Excellent Producer (5/5)'}
                  {rating === 4 && '👍 Very Good Service (4/5)'}
                  {rating === 3 && '😐 Average Trade (3/5)'}
                  {rating === 2 && '👎 Below Expectations (2/5)'}
                  {rating === 1 && '⚠️ Poor Experience (1/5)'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Review Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">
                  Your Experience / Review Comment *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about produce quality, packaging, communication, or fulfillment..."
                  className="w-full p-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                />
              </div>

              <div className="text-[11px] text-[#6B7280] italic">
                Posting as: <strong>{currentUser?.name || 'Verified Buyer'}</strong>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-bold text-[#4B5563] hover:text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {loading ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
