import React, { useState, useEffect } from 'react';
import { X, Megaphone, CreditCard, CheckCircle2, AlertTriangle, Shield, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import type { Product } from '../../types';
import type { Advertisement } from '../../types/advertisement';
import { ADVERTISING_FEE, AD_STATUS_CONFIG, ADVERTISING_DURATION_DAYS } from '../../types/advertisement';
import { formatNaira } from '../../utils/formatters';
import {
  createAdvertisement,
  updateAdvertisementPayment,
  getProductAdvertisement,
  initializePaystackPayment,
  verifyPaystackTransaction,
  generatePaymentReference,
  isPaystackConfigured,
} from '../../services/advertisingService';

interface AdvertiseProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  vendorEmail: string;
  vendorId: string;
  onSuccess?: (ad: Advertisement) => void;
}

export const AdvertiseProductModal: React.FC<AdvertiseProductModalProps> = ({
  product,
  isOpen,
  onClose,
  vendorEmail,
  vendorId,
  onSuccess,
}) => {
  const [existingAd, setExistingAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);

  // Check existing advertisement status when modal opens
  useEffect(() => {
    if (isOpen && product) {
      setPaymentSuccess(false);
      setPaymentError(null);
      setCurrentAd(null);
      checkExistingAdvertisement();
    }
  }, [isOpen, product?.id]);

  const checkExistingAdvertisement = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const ad = await getProductAdvertisement(product.id);
      setExistingAd(ad);
    } catch {
      setExistingAd(null);
    }
    setIsLoading(false);
  };

  const handlePayAndAdvertise = async () => {
    if (!product) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Step 1: Create advertisement record in pending state
      const ad = await createAdvertisement(vendorId, product.id);

      if (!ad) {
        // Fallback for demo mode - simulate the flow
        const demoAd: Advertisement = {
          id: `ad-demo-${Date.now()}`,
          vendorId,
          productId: product.id,
          amount: ADVERTISING_FEE,
          currency: 'NGN',
          paymentReference: null,
          paymentStatus: 'pending',
          advertisementStatus: 'pending',
          startsAt: null,
          expiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentAd(demoAd);
        processPaystackPayment(demoAd);
        return;
      }

      setCurrentAd(ad);

      // Step 2: Initiate Paystack payment
      processPaystackPayment(ad);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initialize advertisement. Please try again.');
      setIsProcessing(false);
    }
  };

  const processPaystackPayment = (ad: Advertisement) => {
    const reference = generatePaymentReference(ad.id);

    if (!isPaystackConfigured()) {
      // Demo mode: Simulate successful payment
      handlePaymentSuccess(ad, reference);
      return;
    }

    initializePaystackPayment(
      vendorEmail,
      ADVERTISING_FEE,
      reference,
      {
        advertisement_id: ad.id,
        product_id: product?.id || '',
        product_name: product?.name || '',
        vendor_id: vendorId,
      },
      async (response) => {
        // Paystack callback success
        await handlePaymentSuccess(ad, response.reference);
      },
      () => {
        // Payment popup closed/cancelled
        handlePaymentCancelled(ad);
      }
    );
  };

  const handlePaymentSuccess = async (ad: Advertisement, reference: string) => {
    try {
      // Step 3: Verify payment server-side
      const verification = await verifyPaystackTransaction(reference);

      if (verification.verified) {
        // Step 4: Update advertisement as paid and active
        const updatedAd = await updateAdvertisementPayment(ad.id, reference, 'success');

        if (updatedAd) {
          setCurrentAd(updatedAd);
          setExistingAd(updatedAd);
        } else {
          // Fallback for demo mode
          const demoUpdatedAd: Advertisement = {
            ...ad,
            paymentReference: reference,
            paymentStatus: 'success',
            advertisementStatus: 'active',
            startsAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ADVERTISING_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          };
          setCurrentAd(demoUpdatedAd);
          setExistingAd(demoUpdatedAd);
        }

        setPaymentSuccess(true);
        onSuccess?.(currentAd || ad);
      } else {
        // Verification failed
        await updateAdvertisementPayment(ad.id, reference, 'failed');
        setPaymentError('Payment verification failed. Your money has not been charged. Please try again.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment verification error. Please contact support.');
    }

    setIsProcessing(false);
  };

  const handlePaymentCancelled = async (ad: Advertisement) => {
    try {
      await updateAdvertisementPayment(ad.id, '', 'cancelled');
    } catch {
      // Silent fail on cancel update
    }
    setPaymentError('Payment was cancelled. Your product has not been advertised.');
    setIsProcessing(false);
  };

  if (!isOpen || !product) return null;

  const isAlreadyActive = existingAd?.advertisementStatus === 'active' && existingAd?.paymentStatus === 'success';
  const isPendingPayment = existingAd?.advertisementStatus === 'pending' && existingAd?.paymentStatus === 'pending';
  const hasFailed = existingAd?.paymentStatus === 'failed' || existingAd?.paymentStatus === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26] text-white p-6 rounded-t-3xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center shadow-md">
              <Megaphone className="w-5 h-5 text-[#0F5132]" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg">Advertise Your Product</h2>
              <p className="text-xs text-emerald-200">Boost visibility with a sponsored listing</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
            </div>
          ) : paymentSuccess ? (
            /* ── SUCCESS STATE ── */
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#0F5132]" />
              </div>
              <h3 className="font-extrabold text-xl text-[#0F5132]">Advertisement Activated!</h3>
              <p className="text-sm text-[#4B5563] max-w-xs mx-auto">
                <strong>"{product.name}"</strong> is now a sponsored product and will appear in the promoted section to all buyers for <strong>{ADVERTISING_DURATION_DAYS} days</strong>.
              </p>
              <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl p-3 text-xs text-[#0F5132] font-bold inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Payment Reference: {currentAd?.paymentReference || 'N/A'}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold py-3 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Product Preview Card */}
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] p-4 flex gap-4">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=200'}
                  alt={product.name}
                  className="w-20 h-20 rounded-xl object-cover border border-[#E8E2D9] shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-[#111827] truncate">{product.name}</h3>
                  <p className="text-xs text-[#4B5563]">{product.category} • {product.lga} LGA</p>
                  <p className="font-bold text-[#0F5132] text-sm">{formatNaira(product.price)} / {product.unit}</p>

                  {/* Current advertising status */}
                  {existingAd ? (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${AD_STATUS_CONFIG[existingAd.advertisementStatus].bgColor} ${AD_STATUS_CONFIG[existingAd.advertisementStatus].color} ${AD_STATUS_CONFIG[existingAd.advertisementStatus].borderColor}`}>
                      {AD_STATUS_CONFIG[existingAd.advertisementStatus].label}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-500">
                      Not Advertised
                    </span>
                  )}
                </div>
              </div>

              {/* Already Active Banner */}
              {isAlreadyActive && (
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#0F5132] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-[#0F5132]">This product is already advertised!</p>
                    <p className="text-[#4B5563]">
                      Active until {existingAd?.expiresAt ? new Date(existingAd.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                    </p>
                    <p className="text-[#4B5563]">
                      Ref: <span className="font-bold">{existingAd?.paymentReference || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Advertising Details */}
              {!isAlreadyActive && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm text-[#111827]">Advertising Package</h4>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#4B5563]">Advertising Fee</span>
                        <span className="font-extrabold text-lg text-[#B45309]">{formatNaira(ADVERTISING_FEE)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#4B5563]">
                        <span>Duration</span>
                        <span className="font-bold">{ADVERTISING_DURATION_DAYS} Days</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#4B5563]">
                        <span>Placement</span>
                        <span className="font-bold">Sponsored Section + Homepage</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#4B5563]">
                        <span>Status</span>
                        <span className="font-bold text-[#0F5132]">
                          {isPendingPayment ? 'Payment Required' : hasFailed ? 'Retry Payment' : 'Ready to Advertise'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      Payment processed securely via <strong>Paystack</strong>. Your advertisement is only activated after successful payment verification. Transaction reference stored for auditing.
                    </p>
                  </div>

                  {/* Error State */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">{paymentError}</p>
                    </div>
                  )}

                  {/* Pay CTA */}
                  <button
                    type="button"
                    onClick={handlePayAndAdvertise}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-2.5 bg-[#0F5132] hover:bg-[#0B3D26] disabled:bg-gray-400 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : hasFailed || isPendingPayment ? (
                      <>
                        <RefreshCw className="w-5 h-5 text-[#F59E0B]" />
                        <span>Retry Payment — {formatNaira(ADVERTISING_FEE)}</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 text-[#F59E0B]" />
                        <span>Pay {formatNaira(ADVERTISING_FEE)} & Advertise</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors py-2"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
