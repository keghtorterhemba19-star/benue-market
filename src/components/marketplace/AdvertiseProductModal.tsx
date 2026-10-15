import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw,
  Send,
  Copy,
  Check,
  Zap,
  Crown,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { Product } from '../../types';
import type { Advertisement, SubscriptionPlanId } from '../../types/advertisement';
import {
  SUBSCRIPTION_PLANS,
  AD_STATUS_CONFIG,
  ADVERTISING_DURATION_DAYS,
} from '../../types/advertisement';
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
import { sendAdvertisementPaymentReceiptEmail } from '../../services/emailService';

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
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('starter');
  const [existingAd, setExistingAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [unverifiedNotice, setUnverifiedNotice] = useState<string | null>(null);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [activeReference, setActiveReference] = useState<string>('');
  const [showTransferMode, setShowTransferMode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const currentPlanConfig = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS.starter;
  const currentPlanFee = currentPlanConfig.price;

  // Check existing advertisement status when modal opens
  useEffect(() => {
    if (isOpen && product) {
      setPaymentSuccess(false);
      setPaymentError(null);
      setUnverifiedNotice(null);
      setCurrentAd(null);
      setShowTransferMode(false);
      checkExistingAdvertisement();
    }
  }, [isOpen, product?.id]);

  const checkExistingAdvertisement = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const ad = await getProductAdvertisement(product.id);
      setExistingAd(ad);
      if (ad?.plan) {
        setSelectedPlan(ad.plan);
      }
      if (ad?.paymentReference) {
        setActiveReference(ad.paymentReference);
      }
    } catch {
      setExistingAd(null);
    }
    setIsLoading(false);
  };

  const handlePayAndSubscribe = async () => {
    if (!product) return;
    setIsProcessing(true);
    setPaymentError(null);
    setUnverifiedNotice(null);

    try {
      // Step 1: Create or fetch subscription record in pending state with selected plan
      let ad = existingAd;
      if (!ad || ad.advertisementStatus !== 'pending') {
        ad = await createAdvertisement(vendorId, product.id, selectedPlan);
      }

      if (!ad) {
        // Fallback demo object if DB offline
        ad = {
          id: `ad-demo-${Date.now()}`,
          vendorId,
          productId: product.id,
          plan: selectedPlan,
          amount: currentPlanFee,
          currency: 'NGN',
          paymentReference: null,
          paymentStatus: 'pending',
          advertisementStatus: 'pending',
          startsAt: null,
          expiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setCurrentAd(ad);
      const reference = ad.paymentReference || generatePaymentReference(ad.id);
      setActiveReference(reference);

      // Step 2: If Paystack is configured, launch Paystack popup
      if (isPaystackConfigured()) {
        initializePaystackPayment(
          vendorEmail,
          currentPlanFee,
          reference,
          {
            advertisement_id: ad.id,
            subscription_plan: selectedPlan,
            plan_name: currentPlanConfig.name,
            product_id: product.id,
            product_name: product.name,
            vendor_id: vendorId,
          },
          async (response) => {
            // Paystack automatic callback
            await handleVerifyAndActivate(ad!, response.reference);
          },
          () => {
            // Popup closed by user
            setIsProcessing(false);
            setShowTransferMode(true);
          }
        );
      } else {
        // Switch to direct transfer view
        setIsProcessing(false);
        setShowTransferMode(true);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to initialize subscription payment. Please try again.');
      setIsProcessing(false);
    }
  };

  /**
   * "I Have Sent It" Verification Handler
   */
  const handleIHaveSentIt = async () => {
    if (!currentAd && !existingAd) return;
    const targetAd = currentAd || existingAd;
    if (!targetAd) return;

    const ref = activeReference || targetAd.paymentReference || generatePaymentReference(targetAd.id);
    setActiveReference(ref);

    setIsVerifying(true);
    setUnverifiedNotice(null);
    setPaymentError(null);

    try {
      // Perform server-side payment verification check
      const verification = await verifyPaystackTransaction(ref);

      if (verification.verified) {
        // Payment verified! Activate subscription and send receipt email
        await handleVerifyAndActivate(targetAd, ref);
      } else {
        setUnverifiedNotice(
          `Payment of ${formatNaira(currentPlanFee)} for ${currentPlanConfig.name} has not been received yet. Please send the transfer before clicking "I Have Sent It".`
        );
        setIsVerifying(false);
      }
    } catch (err: any) {
      setUnverifiedNotice(
        'Payment has not been received yet. Please make sure you have sent the transfer before pressing "I Have Sent It".'
      );
      setIsVerifying(false);
    }
  };

  const handleVerifyAndActivate = async (ad: Advertisement, reference: string) => {
    try {
      const updatedAd = await updateAdvertisementPayment(ad.id, reference, 'success', selectedPlan);

      const finalAd: Advertisement = updatedAd || {
        ...ad,
        plan: selectedPlan,
        amount: currentPlanFee,
        paymentReference: reference,
        paymentStatus: 'success',
        advertisementStatus: 'active',
        startsAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ADVERTISING_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };

      setCurrentAd(finalAd);
      setExistingAd(finalAd);
      setPaymentSuccess(true);
      setUnverifiedNotice(null);
      setPaymentError(null);

      // Send payment receipt
      if (vendorEmail && product) {
        sendAdvertisementPaymentReceiptEmail(vendorEmail, product.name, reference, currentPlanFee);
      }

      onSuccess?.(finalAd);
    } catch (err: any) {
      setPaymentError(err.message || 'Error completing subscription activation. Please contact support.');
    } finally {
      setIsProcessing(false);
      setIsVerifying(false);
    }
  };

  const copyBankDetails = () => {
    navigator.clipboard.writeText('0123456789');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  if (!isOpen || !product) return null;

  const isAlreadyActive = existingAd?.advertisementStatus === 'active' && existingAd?.paymentStatus === 'success';
  const isPendingPayment = existingAd?.advertisementStatus === 'pending' && existingAd?.paymentStatus === 'pending';
  const hasFailed = existingAd?.paymentStatus === 'failed' || existingAd?.paymentStatus === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] max-w-lg w-full max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26] text-white p-6 rounded-t-3xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            disabled={isProcessing || isVerifying}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#FEAE3A] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-[#0F5132]" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg">Product Subscription & Promotion</h2>
              <p className="text-xs text-emerald-200">Boost your produce across Benue State and national markets</p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
              <p className="text-xs text-gray-500 font-semibold">Checking subscription status...</p>
            </div>
          ) : paymentSuccess ? (
            /* ── SUCCESS RECEIPT STATE ── */
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-[#0F5132] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9 text-[#0F5132]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-xl text-[#0F5132]">Subscription Activated Successfully!</h3>
                <p className="text-xs text-gray-600 max-w-xs mx-auto">
                  Your product is now boosted with the <strong>{currentPlanConfig.name}</strong>. Official confirmation sent to <strong>{vendorEmail}</strong>
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                  <span className="text-gray-500">Subscribed Product:</span>
                  <span className="font-bold text-[#111827]">{product.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                  <span className="text-gray-500">Selected Plan:</span>
                  <span className="font-bold text-[#0F5132]">{currentPlanConfig.name} (30 Days)</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                  <span className="text-gray-500">Subscription Amount:</span>
                  <span className="font-extrabold text-[#0F5132]">{formatNaira(currentPlanFee)}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-bold text-[#111827]">{ADVERTISING_DURATION_DAYS} Days Active</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Payment Reference:</span>
                  <span className="font-mono font-bold text-[#0F5132]">{currentAd?.paymentReference || activeReference}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Done & View Listing
              </button>
            </div>
          ) : (
            <>
              {/* Product Preview Card */}
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] p-3.5 flex gap-3.5 items-center">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=200'}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-[#E8E2D9] shrink-0"
                />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-[#111827] truncate">{product.name}</h3>
                  <p className="text-xs text-[#4B5563]">{product.category} • {product.lga} LGA</p>
                  <p className="font-bold text-[#0F5132] text-xs">{formatNaira(product.price)} / {product.unit}</p>
                </div>
                {existingAd && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${AD_STATUS_CONFIG[existingAd.advertisementStatus].bgColor} ${AD_STATUS_CONFIG[existingAd.advertisementStatus].color} ${AD_STATUS_CONFIG[existingAd.advertisementStatus].borderColor}`}>
                    {AD_STATUS_CONFIG[existingAd.advertisementStatus].label}
                  </span>
                )}
              </div>

              {/* Already Active Banner */}
              {isAlreadyActive && (
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#0F5132] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-[#0F5132]">This product has an active subscription!</p>
                    <p className="text-[#4B5563]">
                      Plan: <span className="font-bold text-[#0F5132]">{existingAd?.plan === 'growth' ? 'Growth Plan (₦5,000)' : 'Starter Plan (₦2,000)'}</span>
                    </p>
                    <p className="text-[#4B5563]">
                      Active until {existingAd?.expiresAt ? new Date(existingAd.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                    </p>
                    <p className="text-[#4B5563]">
                      Ref: <span className="font-bold font-mono">{existingAd?.paymentReference || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Subscription Plans Selection Interface */}
              {!isAlreadyActive && (
                <div className="space-y-4">
                  
                  {/* Subscription Plan Cards Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-[#111827]">
                        Choose Monthly Subscription Plan
                      </label>
                      <span className="text-[11px] text-gray-500 font-medium">30 Days Cycle</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Plan 1: Starter Plan (₦2,000) */}
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('starter')}
                        className={`text-left p-4 rounded-2xl border-2 transition-all relative ${
                          selectedPlan === 'starter'
                            ? 'border-[#0F5132] bg-[#E8F5E9]/50 shadow-md ring-2 ring-[#0F5132]/20'
                            : 'border-[#E8E2D9] bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-[#0F5132]">
                            <Zap className="w-3 h-3 text-[#0F5132]" />
                            <span>Starter</span>
                          </span>
                          {selectedPlan === 'starter' && (
                            <span className="w-5 h-5 rounded-full bg-[#0F5132] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className="text-lg font-black text-[#0F5132]">
                          {formatNaira(SUBSCRIPTION_PLANS.starter.price)}
                          <span className="text-xs font-normal text-gray-500"> / mo</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                          {SUBSCRIPTION_PLANS.starter.tagline}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-emerald-100/80 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
                            <Check className="w-3 h-3 text-[#0F5132] shrink-0" />
                            <span>30-Day Produce Listing</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
                            <Check className="w-3 h-3 text-[#0F5132] shrink-0" />
                            <span>Verified Badge on produce</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-700">
                            <Check className="w-3 h-3 text-[#0F5132] shrink-0" />
                            <span>Category search priority</span>
                          </div>
                        </div>
                      </button>

                      {/* Plan 2: Growth Plan (₦5,000) */}
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('growth')}
                        className={`text-left p-4 rounded-2xl border-2 transition-all relative ${
                          selectedPlan === 'growth'
                            ? 'border-[#B45309] bg-[#FEF3C7]/40 shadow-md ring-2 ring-[#F59E0B]/30'
                            : 'border-[#E8E2D9] bg-white hover:border-amber-300 hover:bg-amber-50/20'
                        }`}
                      >
                        <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-[#D97706] to-[#B45309] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                          ★ Most Popular
                        </div>

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-[#92400E]">
                            <Crown className="w-3 h-3 text-[#B45309]" />
                            <span>Growth Plan</span>
                          </span>
                          {selectedPlan === 'growth' && (
                            <span className="w-5 h-5 rounded-full bg-[#B45309] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className="text-lg font-black text-[#B45309]">
                          {formatNaira(SUBSCRIPTION_PLANS.growth.price)}
                          <span className="text-xs font-normal text-gray-500"> / mo</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                          {SUBSCRIPTION_PLANS.growth.tagline}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-amber-200/60 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-800 font-medium">
                            <Check className="w-3 h-3 text-[#B45309] shrink-0" />
                            <span>Top Homepage Carousel</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-800 font-medium">
                            <Check className="w-3 h-3 text-[#B45309] shrink-0" />
                            <span>VIP Gold vendor badge</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-800 font-medium">
                            <Check className="w-3 h-3 text-[#B45309] shrink-0" />
                            <span>Interstate bulk merchant leads</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-gradient-to-r from-emerald-50 via-amber-50/40 to-emerald-50 border border-[#E8E2D9] rounded-2xl p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-500">Plan selected: </span>
                      <strong className="text-[#111827]">{currentPlanConfig.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Total: </span>
                      <strong className="text-[#0F5132] text-sm">{formatNaira(currentPlanFee)}</strong>
                      <span className="text-[10px] text-gray-500"> / 30 days</span>
                    </div>
                  </div>

                  {/* Unverified Payment Notice Alert */}
                  {unverifiedNotice && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-2 animate-in fade-in zoom-in-95">
                      <div className="flex items-start gap-2.5 font-extrabold text-amber-950 text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Payment Has Not Been Received Yet</span>
                      </div>
                      <p className="leading-relaxed text-amber-900 font-medium">
                        {unverifiedNotice}
                      </p>
                      <div className="pt-1 text-[11px] text-amber-800 border-t border-amber-200/60 font-semibold">
                        💡 No receipt has been generated yet. Please make the transfer or complete Paystack payment first before verifying.
                      </div>
                    </div>
                  )}

                  {/* Standard Error Notice */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-700 font-medium">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Transfer / Direct Payment Instructions Modal View */}
                  {showTransferMode && (
                    <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#0F5132]" />
                          <span>Bank Transfer for {currentPlanConfig.name}</span>
                        </h4>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          Ref: {activeReference ? activeReference.substring(0, 14) : 'BM-AD'}...
                        </span>
                      </div>

                      <div className="bg-white border border-[#E8E2D9] rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Bank Name:</span>
                          <span className="font-bold text-[#111827]">Access Bank / Zenith Bank</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Account Name:</span>
                          <span className="font-bold text-[#111827]">Benue Market Services</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                          <span className="text-gray-500">Account Number:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-extrabold text-[#0F5132] text-sm">0123456789</span>
                            <button
                              type="button"
                              onClick={copyBankDetails}
                              className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
                              title="Copy account number"
                            >
                              {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Amount to Transfer:</span>
                          <span className="font-extrabold text-[#B45309] text-sm">{formatNaira(currentPlanFee)}</span>
                        </div>
                      </div>

                      {/* "I HAVE SENT IT" VERIFICATION BUTTON */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={handleIHaveSentIt}
                          disabled={isVerifying}
                          className="w-full bg-[#0F5132] hover:bg-[#0B3D26] disabled:bg-gray-400 text-white font-black text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Verifying Payment Status...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-[#FEAE3A]" />
                              <span>I Have Sent It (Verify & Activate {currentPlanConfig.name})</span>
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-gray-500 text-center">
                          Click above only after completing your transfer. The system will verify before activating your subscription.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Primary Pay Button */}
                  {!showTransferMode && (
                    <button
                      type="button"
                      onClick={handlePayAndSubscribe}
                      disabled={isProcessing || isVerifying}
                      className="w-full inline-flex items-center justify-center gap-2.5 bg-[#0F5132] hover:bg-[#0B3D26] disabled:bg-gray-400 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Initializing Subscription...</span>
                        </>
                      ) : hasFailed || isPendingPayment ? (
                        <>
                          <RefreshCw className="w-5 h-5 text-[#FEAE3A]" />
                          <span>Retry Subscription — {formatNaira(currentPlanFee)} ({currentPlanConfig.name})</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 text-[#FEAE3A]" />
                          <span>Subscribe Now ({formatNaira(currentPlanFee)} / mo)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Close / Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing || isVerifying}
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
