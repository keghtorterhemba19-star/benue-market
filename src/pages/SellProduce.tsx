import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, ShieldCheck, Trash2, ArrowRight, PlusCircle, LayoutDashboard, Store, ArrowLeft, ShieldAlert, ImagePlus, X, Edit3, MapPin, Phone, MessageCircle, Package, Tag, ChevronRight, Layers, Sparkles, UploadCloud, Camera, Boxes, Award, Check } from 'lucide-react';
import { BENUE_LGAS, PRODUCE_CATEGORIES } from '../constants/benue';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import type { BenueLGA, CategoryType, Product } from '../types';
import { formatNaira, cleanNigerianPhoneForWhatsapp } from '../utils/formatters';
import { uploadProduceImageToSupabase } from '../services/productService';
import { compressImageFile } from '../utils/imageCompressor';

type FormStep = 1 | 2 | 3;

const STEP_LABELS = [
  { step: 1 as FormStep, label: 'Produce Info', icon: Package },
  { step: 2 as FormStep, label: 'Pricing & Contact', icon: Tag },
  { step: 3 as FormStep, label: 'Review Profile', icon: Eye },
];

export const SellProduce: React.FC = () => {
  const { addNewProduct, deleteProduct } = useProducts();
  const { currentUser, isSeller, isAuthenticated, switchRole } = useAuth();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const [_activeUploadSlot, setActiveUploadSlot] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);

  const [formData, setFormData] = useState({
    name: '',
    category: 'tubers' as CategoryType,
    description: '',
    price: '',
    unit: '100kg Bag',
    quantity: '100',
    minimumOrder: '5',
    qualityGrade: 'Grade A (Premium Export Quality)',
    location: currentUser?.location || 'Zaki Biam Yam Market',
    lga: (currentUser?.lga as BenueLGA) || 'Ukum',
    images: ['', '', ''] as string[],
    phone: currentUser?.phone || '08031234567',
    whatsapp: currentUser?.whatsapp || currentUser?.phone || '08031234567',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Check if user is not signed in
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="w-full bg-[#FBF9F6] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-[#E8E2D9] shadow-sm max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#0F5132] flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
              Farmer / Seller Portal
            </span>
            <h2 className="font-extrabold text-2xl text-[#111827]">
              Farmer Sign In Required
            </h2>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              Only verified Farmers, Agricultural Cooperatives, and Produce Sellers can list harvests on the Benue Marketplace. Please sign in with your seller account.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/login?redirect=/sell-produce"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Sign In as Farmer / Seller</span>
            </Link>

            <Link
              to="/register?role=farmer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold py-3 px-4 rounded-xl border border-[#D6CDC0] transition-colors"
            >
              <span>Create Free Farmer Account</span>
            </Link>

            <div className="pt-2">
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5132] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Browse Produce</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Check if user is a buyer/merchant (Restrict access)
  if (!isSeller && currentUser.role !== 'seller') {
    return (
      <div className="w-full bg-[#FBF9F6] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-amber-200 shadow-sm max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Seller Account Required
            </span>
            <h2 className="font-extrabold text-2xl text-[#111827]">
              Restricted to Farmers & Producers
            </h2>
            <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
              You are currently signed in as a <strong className="text-[#111827]">Buyer / Merchant ({currentUser.name})</strong>. Only registered <strong className="text-[#0F5132]">Farmers, Cooperatives, and Produce Sellers</strong> are permitted to list and upload agricultural harvests.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await switchRole('seller');
                setToastMessage('Account switched to Seller/Farmer profile.');
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <Store className="w-4 h-4 text-[#FEF3C7]" />
              <span>Switch to Farmer / Seller Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <Link
              to="/buyer-dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold py-3 px-4 rounded-xl border border-[#D6CDC0] transition-colors"
            >
              <span>Go to Buyer Dashboard</span>
            </Link>

            <div className="pt-2">
              <Link
                to="/browse"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F5132] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Browsing Produce as Buyer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slotIndex);
    try {
      const publicUrl = await uploadProduceImageToSupabase(file, 'produce');
      if (publicUrl) {
        setFormData((prev) => {
          const newImages = [...prev.images];
          newImages[slotIndex] = publicUrl;
          return { ...prev, images: newImages };
        });
      } else {
        // Automatic Local Compression Fallback (minimizes capacity for database/localStorage insertion)
        const compressedDataUrl = await compressImageFile(file, 800, 800, 0.72);
        setFormData((prev) => {
          const newImages = [...prev.images];
          newImages[slotIndex] = compressedDataUrl;
          return { ...prev, images: newImages };
        });
      }
    } catch (err) {
      console.warn('Error uploading photo:', err);
    } finally {
      setUploadingSlot(null);
    }
  };

  const removeImage = (slotIndex: number) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[slotIndex] = '';
      return { ...prev, images: newImages };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Produce title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Market or community location is required';

    if (!formData.images[0] || !formData.images[0].trim()) {
      newErrors.images = 'Main card cover photo (Photo 1) is required to list your produce';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Valid price in Naira is required';
    if (!formData.unit.trim()) newErrors.unit = 'Price unit is required (e.g. 100kg Bag, Tuber)';
    if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = 'Total available quantity is required';
    if (!formData.minimumOrder || Number(formData.minimumOrder) <= 0) newErrors.minimumOrder = 'Minimum order quantity is required';
    if (Number(formData.minimumOrder) > Number(formData.quantity)) {
      newErrors.minimumOrder = 'Minimum order cannot exceed total available stock';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required for buyers to call you';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const cleanedPhone = cleanNigerianPhoneForWhatsapp(formData.phone);
      const cleanedWhatsapp = cleanNigerianPhoneForWhatsapp(formData.whatsapp || formData.phone);

      const product = await addNewProduct({
        sellerId: currentUser?.id || 'farmer-1',
        sellerName: currentUser?.name || 'Benue Local Farmer',
        sellerPhone: cleanedPhone,
        sellerWhatsapp: cleanedWhatsapp,
        isVerifiedSeller: true,
        sellerRole: 'farmer',
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: Number(formData.price),
        unit: formData.unit,
        quantity: Number(formData.quantity) || 1,
        minimumOrder: Number(formData.minimumOrder) || 1,
        location: formData.location,
        lga: formData.lga,
        images: formData.images.filter((img) => img.trim() !== ''),
        availability: 'in_stock',
        isFeatured: true,
      });

      setCreatedProduct(product);
      setToastMessage('Harvest listing published live to Benue Marketplace!');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to list produce. Please verify all details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantDelete = async (productId: string) => {
    await deleteProduct(productId);
    setCreatedProduct(null);
    setToastMessage('Listing deleted successfully.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const categoryName = PRODUCE_CATEGORIES.find(c => c.id === formData.category)?.name || formData.category;

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-lg border border-[#374151] flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {createdProduct && (
        <DeleteConfirmModal
          product={createdProduct}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirmDelete={handleInstantDelete}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
          <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
            Farmer & Producer Portal
          </span>
          <h1 className="font-extrabold text-2xl md:text-3xl text-[#111827] tracking-tight">
            List Your Harvest / Agricultural Produce
          </h1>
          <p className="text-xs md:text-sm text-[#4B5563]">
            Fill out the details below to publish your listing directly to thousands of buyers looking for produce in Benue State.
          </p>
        </div>

        {/* Success Banner Card with Instant Delete Option */}
        {createdProduct && (
          <div className="bg-[#E8F5E9] border-2 border-[#0F5132] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#C8E6C9]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-[#FEF3C7]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F5132] uppercase tracking-wider">
                    Published Live
                  </span>
                  <h2 className="font-extrabold text-xl md:text-2xl text-[#111827]">
                    Produce Successfully Listed!
                  </h2>
                  <p className="text-xs text-[#4B5563] mt-0.5">
                    Your harvest is now live on Benue Market. Buyers can find and contact you immediately.
                  </p>
                </div>
              </div>

              {/* Delete / Revert Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-red-200 transition-colors shadow-xs"
                  title="Delete this listing if uploaded by mistake"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Listing</span>
                </button>
              </div>
            </div>

            {/* Product Snapshot */}
            <div className="bg-white p-4 rounded-xl border border-[#C8E6C9] flex flex-col sm:flex-row items-center gap-4">
              <img
                src={createdProduct.images[0]}
                alt={createdProduct.name}
                className="w-20 h-20 rounded-lg object-cover border border-[#E8E2D9] shrink-0"
              />
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="text-[11px] font-bold text-[#B45309] uppercase">{createdProduct.category}</span>
                <h4 className="font-extrabold text-base text-[#111827] truncate">{createdProduct.name}</h4>
                <p className="text-xs font-bold text-[#0F5132] mt-0.5">
                  {formatNaira(createdProduct.price)} / {createdProduct.unit}
                </p>
                <p className="text-[11px] text-[#4B5563]">
                  📍 {createdProduct.location} ({createdProduct.lga} LGA) • Available: {createdProduct.quantity}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <Link
                  to={`/product/${createdProduct.id}`}
                  className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  <span>View Live Listing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => {
                    setCreatedProduct(null);
                    setCurrentStep(1);
                    setFormData({
                      name: '',
                      category: 'tubers',
                      description: '',
                      price: '',
                      unit: '100kg Bag',
                      quantity: '100',
                      minimumOrder: '5',
                      qualityGrade: 'Export Grade A',
                      location: 'Zaki Biam Yam Market',
                      lga: 'Ukum',
                      images: ['', '', ''],
                      phone: currentUser?.phone || '08031234567',
                      whatsapp: currentUser?.whatsapp || '08031234567',
                    });
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#D6CDC0] shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List Another Item</span>
                </button>

                <Link
                  to={currentUser?.role === 'seller' ? '/farmer-dashboard' : '/buyer-dashboard'}
                  className="inline-flex items-center gap-1.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#D6CDC0] shadow-xs transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>Go to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP INDICATOR ── */}
        {!createdProduct && (
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E8E2D9] shadow-sm">
            <div className="flex items-center justify-between">
              {STEP_LABELS.map((s, idx) => {
                const StepIcon = s.icon;
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                return (
                  <React.Fragment key={s.step}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCompleted) setCurrentStep(s.step);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#0F5132] text-white shadow-sm'
                          : isCompleted
                          ? 'bg-[#E8F5E9] text-[#0F5132] cursor-pointer hover:bg-[#d0ebda]'
                          : 'bg-[#F9FAFB] text-[#9CA3AF]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isCompleted
                          ? 'bg-[#0F5132] text-white'
                          : 'bg-[#E5E7EB] text-[#9CA3AF]'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step {s.step}</span>
                        <p className="text-xs font-extrabold leading-tight flex items-center gap-1">
                          <span>{s.label}</span>
                          <StepIcon className="w-3.5 h-3.5 opacity-80" />
                        </p>
                      </div>
                    </button>
                    {idx < STEP_LABELS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                        currentStep > s.step ? 'bg-[#0F5132]' : 'bg-[#E5E7EB]'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FORM CONTENT ── */}
        {!createdProduct && (
          <form onSubmit={handleSubmit}>
            {/* ═══════════════ STEP 1: Produce Info & Photos ═══════════════ */}
            {currentStep === 1 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6 animate-in fade-in slide-in-from-right-5">
                {/* Authenticated Seller Verification Header */}
                <div className="bg-[#E8F5E9] p-4 rounded-xl border border-[#C8E6C9] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-base shrink-0">
                      {currentUser?.name?.charAt(0) || 'F'}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                        <span>Verified Seller Account</span>
                      </span>
                      <h4 className="font-extrabold text-sm text-[#111827]">{currentUser?.name}</h4>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-[#0F5132] px-2.5 py-1 rounded-full border border-[#C8E6C9]">
                    Authorized Producer
                  </span>
                </div>

                <h3 className="font-extrabold text-lg text-[#111827] border-b border-[#E8E2D9] pb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0F5132]" />
                  Produce Information
                </h3>

                {/* Produce Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827]">
                    Produce Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Export Grade White Yam (Pona variety)"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                  {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
                </div>

                {/* Modern & Premium Produce Photos Section (1 Required, 2 Optional) */}
                <div className="space-y-4 bg-[#FBF9F6] p-4 md:p-5 rounded-2xl border border-[#E8E2D9]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-[#E8E2D9]/60">
                    <div>
                      <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#0F5132]" />
                        <span>Produce Photos</span>
                      </label>
                      <p className="text-[11px] text-[#6B7280] leading-tight mt-0.5">
                        <span className="font-bold text-[#0F5132]">1 Photo Required</span> (Main Card Cover) • 2 Optional Detail Photos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all ${
                        formData.images[0]
                          ? 'bg-emerald-50 text-[#0F5132] border-emerald-300 shadow-xs'
                          : 'bg-amber-50 text-[#B45309] border-amber-300'
                      }`}>
                        {formData.images.filter(i => i.trim() !== '').length} of 3 Uploaded
                      </span>
                    </div>
                  </div>

                  {/* Photos Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Photo (Slot 0 - Required) - Spans 7 cols */}
                    <div className="md:col-span-7 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#0F5132] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          Main Cover Photo <span className="text-red-500 font-bold">*Required</span>
                        </span>
                        {formData.images[0] && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        )}
                      </div>

                      <div
                        className={`relative flex-1 min-h-[200px] sm:min-h-[230px] rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all group ${
                          formData.images[0]
                            ? 'border-[#0F5132] bg-white shadow-sm'
                            : 'border-[#0F5132]/40 bg-gradient-to-br from-white via-white to-[#E8F5E9]/50 hover:border-[#0F5132] hover:bg-[#E8F5E9]/60'
                        }`}
                        onClick={() => {
                          if (uploadingSlot !== 0) {
                            setActiveUploadSlot(0);
                            fileInputRefs.current[0]?.click();
                          }
                        }}
                      >
                        {formData.images[0] ? (
                          <>
                            <img src={formData.images[0]} alt="Main produce card cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
                              <button
                                type="button"
                                className="bg-white/95 hover:bg-white text-[#111827] text-xs font-extrabold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                              >
                                <UploadCloud className="w-4 h-4 text-[#0F5132]" />
                                Change Photo
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(0); }}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold p-2 rounded-xl shadow-lg transition-transform active:scale-95"
                                title="Remove photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-3 left-3 bg-[#0F5132]/90 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              Primary Card Photo
                            </div>
                          </>
                        ) : uploadingSlot === 0 ? (
                          <div className="flex flex-col items-center gap-2 p-4">
                            <div className="w-8 h-8 border-3 border-[#0F5132] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[#0F5132]">Uploading to Supabase...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center p-5 space-y-2.5">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-[#C8E6C9] shadow-sm flex items-center justify-center text-[#0F5132] group-hover:scale-110 transition-transform">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-[#111827]">Upload Main Produce Photo</p>
                              <p className="text-[10px] text-[#6B7280] max-w-[220px] mx-auto mt-0.5 leading-tight">
                                Displayed first on buyer cards and marketplace search results
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 bg-[#0F5132] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-xs">
                              <ImagePlus className="w-3.5 h-3.5" /> Browse Image
                            </span>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={(el) => { fileInputRefs.current[0] = el; }}
                        onChange={(e) => handlePhotoUpload(e, 0)}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    {/* Optional Detail Photos (Slots 1 & 2) - Spans 5 cols */}
                    <div className="md:col-span-5 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#374151]">
                          Detail Photos <span className="text-[#6B7280] font-normal">(Optional)</span>
                        </span>
                        <span className="text-[10px] text-[#6B7280]">Extra angles</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 flex-1">
                        {[1, 2].map((slotIndex) => {
                          const slotLabel = slotIndex === 1 ? 'Detail Photo 2' : 'Detail Photo 3';
                          const imgSrc = formData.images[slotIndex];
                          const isUploading = uploadingSlot === slotIndex;

                          return (
                            <div key={slotIndex} className="relative flex-1 min-h-[95px] flex flex-col">
                              <div
                                className={`relative flex-1 rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all group ${
                                  imgSrc
                                    ? 'border-[#0F5132] bg-white shadow-xs'
                                    : 'border-[#D6CDC0] bg-white hover:border-[#0F5132]/60 hover:bg-[#E8F5E9]/30'
                                }`}
                                onClick={() => {
                                  if (!isUploading) {
                                    setActiveUploadSlot(slotIndex);
                                    fileInputRefs.current[slotIndex]?.click();
                                  }
                                }}
                              >
                                {imgSrc ? (
                                  <>
                                    <img src={imgSrc} alt={`Detail photo ${slotIndex}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                      <button
                                        type="button"
                                        className="bg-white/95 hover:bg-white text-[#111827] text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm"
                                      >
                                        Change
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(slotIndex); }}
                                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg shadow-sm"
                                        title="Remove photo"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                      {slotLabel}
                                    </div>
                                  </>
                                ) : isUploading ? (
                                  <div className="flex flex-col items-center gap-1 p-2">
                                    <div className="w-5 h-5 border-2 border-[#0F5132] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-[#0F5132]">Uploading...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2.5 p-2.5 text-left w-full">
                                    <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] group-hover:text-[#0F5132] group-hover:bg-[#E8F5E9] shrink-0 transition-colors">
                                      <ImagePlus className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-[#374151] group-hover:text-[#0F5132] truncate transition-colors">
                                        + Add {slotLabel}
                                      </p>
                                      <p className="text-[9px] text-[#9CA3AF] truncate">Optional detail view</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Hidden File Input */}
                              <input
                                type="file"
                                ref={(el) => { fileInputRefs.current[slotIndex] = el; }}
                                onChange={(e) => handlePhotoUpload(e, slotIndex)}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {errors.images && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                      {errors.images}
                    </p>
                  )}
                </div>

                {/* Category & LGA Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
                    >
                      {PRODUCE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">Benue LGA Location</label>
                    <select
                      name="lga"
                      value={formData.lga}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
                    >
                      {BENUE_LGAS.map((lga) => (
                        <option key={lga.name} value={lga.name}>
                          {lga.name} LGA
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific Market Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827]">
                    Specific Market / Village Depot <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Zaki Biam Yam Market, Section C"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132]"
                  />
                  {errors.location && <p className="text-xs text-red-600 font-medium">{errors.location}</p>}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827]">
                    Produce Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe freshness, harvest date, variety, condition, packaging..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132]"
                  />
                  {errors.description && <p className="text-xs text-red-600 font-medium">{errors.description}</p>}
                </div>

                {/* Next Step Button */}
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Continue to Pricing & Contact</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ═══════════════ STEP 2: Pricing & Contact ═══════════════ */}
            {currentStep === 2 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-6 animate-in fade-in slide-in-from-right-5">
                {/* 1. Unit Pricing */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-base text-[#111827] border-b border-[#E8E2D9] pb-2 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#0F5132]" />
                    Pricing & Wholesale Unit
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111827]">
                        Price per Unit in Naira (₦) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#0F5132]">₦</span>
                        <input
                          type="number"
                          name="price"
                          placeholder="e.g. 45000"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full pl-8 pr-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm font-bold text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                        />
                      </div>
                      {errors.price && <p className="text-xs text-red-600 font-medium">{errors.price}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111827]">
                        Measurement Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="unit"
                        placeholder="e.g. 100kg Bag, 100 Tubers, Crate"
                        value={formData.unit}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm font-bold text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                      />
                      {errors.unit && <p className="text-xs text-red-600 font-medium">{errors.unit}</p>}
                    </div>
                  </div>
                </div>

                {/* 2. Modern Quantity Available & Minimum Order Quantity Feature Card */}
                <div className="bg-[#F8FAF8] p-5 md:p-6 rounded-2xl border border-[#C8E6C9] space-y-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#C8E6C9]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#0F5132] text-white flex items-center justify-center shadow-xs">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#111827]">Quantity Available & Minimum Order</h4>
                        <p className="text-[11px] text-[#4B5563]">Set your available inventory stock and minimum purchase limit for buyers.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-[#E8F5E9] text-[#0F5132] px-2.5 py-1 rounded-full border border-[#C8E6C9] hidden sm:inline-block">
                      Wholesale Control
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Quantity Available */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#111827] flex items-center justify-between">
                        <span>Quantity Available <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-[#0F5132] font-bold">Total Stock</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="quantity"
                          placeholder="e.g. 500"
                          value={formData.quantity}
                          onChange={handleChange}
                          className="w-full pl-4 pr-24 py-2.5 bg-white border border-[#D6CDC0] rounded-xl text-sm font-bold text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-md max-w-[85px] truncate">
                          {formData.unit || 'units'}
                        </span>
                      </div>
                      {errors.quantity && <p className="text-xs text-red-600 font-medium">{errors.quantity}</p>}
                      {/* Quick presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[#6B7280] font-bold mr-1">Presets:</span>
                        {[50, 100, 250, 500, 1000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, quantity: String(val) }))}
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition-all ${
                              formData.quantity === String(val)
                                ? 'bg-[#0F5132] text-white border-[#0F5132]'
                                : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#E8F5E9]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Order Quantity */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#111827] flex items-center justify-between">
                        <span>Minimum Order Quantity (MOQ) <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-[#B45309] font-bold">Min Limit</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="minimumOrder"
                          placeholder="e.g. 5"
                          value={formData.minimumOrder}
                          onChange={handleChange}
                          className="w-full pl-4 pr-24 py-2.5 bg-white border border-[#D6CDC0] rounded-xl text-sm font-bold text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-md max-w-[85px] truncate">
                          {formData.unit || 'units'}
                        </span>
                      </div>
                      {errors.minimumOrder && <p className="text-xs text-red-600 font-medium">{errors.minimumOrder}</p>}
                      {/* Quick presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[#6B7280] font-bold mr-1">Presets:</span>
                        {[1, 5, 10, 20, 50].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, minimumOrder: String(val) }))}
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition-all ${
                              formData.minimumOrder === String(val)
                                ? 'bg-[#0F5132] text-white border-[#0F5132]'
                                : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#E8F5E9]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Produce Quality & Grade Selection */}
                  <div className="space-y-2.5 pt-2 border-t border-[#C8E6C9]/60">
                    <label className="text-xs font-extrabold text-[#111827] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#0F5132]" />
                        <span>Produce Quality Grade</span>
                      </span>
                      <span className="text-[10px] text-[#0F5132] font-bold">Builds Buyer Trust</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'Grade A (Premium Export Quality)', title: 'Grade A Premium', desc: 'Top grade export quality harvest', badge: '⭐ Premium' },
                        { id: 'Grade B (Standard Market Quality)', title: 'Grade B Standard', desc: 'Fresh local commercial standard', badge: '🌾 Standard' },
                        { id: '100% Organic (Naturally Farmed)', title: '100% Organic', desc: 'Naturally grown in Benue soil', badge: '🌱 Organic' },
                      ].map((item) => {
                        const isSelected = formData.qualityGrade === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setFormData((prev) => ({ ...prev, qualityGrade: item.id }))}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-white border-[#0F5132] ring-2 ring-[#0F5132]/20 shadow-xs'
                                : 'bg-white/60 border-[#D6CDC0] hover:border-[#0F5132]/50 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-extrabold text-[#0F5132] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#0F5132]" />}
                            </div>
                            <h5 className="text-xs font-extrabold text-[#111827]">{item.title}</h5>
                            <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <h3 className="font-extrabold text-lg text-[#111827] border-b border-[#E8E2D9] pb-3 pt-2 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#0F5132]" />
                  Farmer Direct Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">
                      Phone Number (For Calls) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="08031234567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
                    />
                    {errors.phone && <p className="text-xs text-red-600 font-medium">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827]">WhatsApp Number</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      placeholder="08031234567"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="flex-1 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-sm font-bold py-3.5 rounded-xl border border-[#D6CDC0] transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="flex-[2] bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Profile Before Publishing</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════ STEP 3: Review Profile ═══════════════ */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-5">
                {/* Review Header */}
                <div className="bg-gradient-to-br from-[#0F5132] to-[#0B3D26] p-6 md:p-8 rounded-2xl shadow-sm text-white space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Eye className="w-6 h-6 text-[#FEF3C7]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FEF3C7]/80">
                        Step 3 of 3
                      </span>
                      <h2 className="font-extrabold text-xl md:text-2xl">Review Your Listing</h2>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Please review all the information below carefully before publishing your listing. Buyers will see exactly what is shown here.
                  </p>
                </div>

                {submitError && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* ── Photo Gallery Preview ── */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#0F5132]" />
                        Listing Photos ({formData.images.filter(i => i.trim() !== '').length} of 3 Uploaded)
                      </h4>
                      <p className="text-[11px] text-[#6B7280]">1 Main Cover Photo + {formData.images.slice(1).filter(i => i.trim() !== '').length} Optional Detail Photos</p>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[11px] font-extrabold text-[#0F5132] hover:underline flex items-center gap-1 bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Photos
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className={`relative aspect-square rounded-xl overflow-hidden border ${img ? 'border-[#0F5132]' : 'border-dashed border-[#D6CDC0] bg-[#FBF9F6]'}`}>
                        {img ? (
                          <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#9CA3AF]">
                            <ImagePlus className="w-5 h-5 mb-1" />
                            <span className="text-[9px] font-bold text-[#9CA3AF]">Optional - Not uploaded</span>
                          </div>
                        )}
                        <div className={`absolute bottom-1.5 left-1.5 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs ${idx === 0 ? 'bg-[#0F5132]' : 'bg-black/60'}`}>
                          {idx === 0 ? '⭐ Main Cover' : `Detail ${idx + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Produce Details ── */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#0F5132]" />
                      Produce Details
                    </h4>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[11px] font-bold text-[#0F5132] hover:underline flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Title */}
                    <div className="flex items-start gap-3 p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4 text-[#0F5132]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Produce Title</span>
                        <p className="text-sm font-extrabold text-[#111827] leading-snug">{formData.name || '—'}</p>
                      </div>
                    </div>

                    {/* Category & LGA */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Category</span>
                        <p className="text-sm font-bold text-[#111827] mt-0.5">{categoryName}</p>
                      </div>
                      <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">LGA</span>
                        <p className="text-sm font-bold text-[#111827] mt-0.5">{formData.lga} LGA</p>
                      </div>
                    </div>

                    {/* Market Location */}
                    <div className="flex items-start gap-3 p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-[#0F5132]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Market / Depot</span>
                        <p className="text-sm font-bold text-[#111827]">{formData.location || '—'}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Description</span>
                      <p className="text-xs text-[#374151] mt-1 leading-relaxed whitespace-pre-wrap">{formData.description || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* ── Pricing, Quantity Available & Minimum Order Quantity ── */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#0F5132]" />
                      Pricing, Quantity Available & Minimum Order
                    </h4>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-[11px] font-extrabold text-[#0F5132] hover:underline flex items-center gap-1 bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-gradient-to-br from-[#E8F5E9] to-[#F0FFF4] rounded-xl border border-[#C8E6C9] text-center">
                      <span className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider">Unit Price</span>
                      <p className="text-lg font-extrabold text-[#0F5132] mt-1">
                        {formData.price ? formatNaira(Number(formData.price)) : '₦0'}
                      </p>
                      <span className="text-[10px] text-[#4B5563] font-semibold">per {formData.unit}</span>
                    </div>

                    <div className="p-4 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3] text-center">
                      <span className="text-[10px] font-extrabold text-[#111827] uppercase tracking-wider">Quantity Available</span>
                      <p className="text-lg font-extrabold text-[#111827] mt-1">{formData.quantity || '0'}</p>
                      <span className="text-[10px] text-[#0F5132] font-extrabold">{formData.unit} in stock</span>
                    </div>

                    <div className="p-4 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3] text-center">
                      <span className="text-[10px] font-extrabold text-[#B45309] uppercase tracking-wider">Minimum Order (MOQ)</span>
                      <p className="text-lg font-extrabold text-[#111827] mt-1">{formData.minimumOrder || '1'}</p>
                      <span className="text-[10px] text-[#4B5563] font-semibold">{formData.unit} min limit</span>
                    </div>
                  </div>

                  {/* Quality Badge in Review */}
                  <div className="p-3 bg-[#E8F5E9]/60 rounded-xl border border-[#C8E6C9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#0F5132]" />
                      <span className="text-xs font-extrabold text-[#111827]">Produce Quality Standard:</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#0F5132] bg-white px-2.5 py-1 rounded-lg border border-[#C8E6C9] shadow-2xs">
                      {formData.qualityGrade || 'Grade A (Premium Export Quality)'}
                    </span>
                  </div>
                </div>

                {/* ── Contact Info ── */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0F5132]" />
                      Contact Information
                    </h4>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-[11px] font-bold text-[#0F5132] hover:underline flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                    <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser?.name?.charAt(0) || 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                        <span className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider">Verified Seller</span>
                      </div>
                      <p className="text-sm font-extrabold text-[#111827]">{currentUser?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-[#0F5132]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Phone</span>
                        <p className="text-sm font-bold text-[#111827]">{formData.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#FBF9F6] rounded-xl border border-[#F0EBE3]">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-[#0F5132]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">WhatsApp</span>
                        <p className="text-sm font-bold text-[#111827]">{formData.whatsapp || formData.phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Buyer Card Preview ── */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#B45309]" />
                    Live Buyer Card Preview
                  </h4>

                  <div className="max-w-sm mx-auto bg-white rounded-2xl border-2 border-[#0F5132] overflow-hidden shadow-md p-1">
                    <div className="relative aspect-[4/3] bg-[#F3F4F6] overflow-hidden rounded-xl">
                      {formData.images[0] ? (
                        <img
                          src={formData.images[0]}
                          alt={formData.name || 'Produce Preview'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3AF] gap-2">
                          <ImagePlus className="w-10 h-10" />
                          <span className="text-xs font-bold">Card Photo Preview</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-[#0F5132] border border-[#E8E2D9]">
                        {formData.lga} LGA
                      </div>
                      {formData.images.filter(img => img.trim() !== '').length > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          📸 {formData.images.filter(img => img.trim() !== '').length}/3
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="text-xs text-[#0F5132] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {currentUser?.name || 'Benue Local Farmer'}
                      </div>

                      <h3 className="font-extrabold text-base text-[#111827]">
                        {formData.name || 'Sample Produce Title'}
                      </h3>

                      <p className="text-xs text-[#4B5563] line-clamp-2">
                        {formData.description || 'Harvest produce details will appear here...'}
                      </p>

                      <div className="pt-2 border-t border-[#E8E2D9] flex items-baseline justify-between">
                        <span className="font-extrabold text-xl text-[#0F5132]">
                          {formData.price ? formatNaira(Number(formData.price)) : '₦0'}
                        </span>
                        <span className="text-xs text-[#4B5563] font-medium">/ {formData.unit}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                        <div className="bg-[#F9FAFB] text-xs font-bold py-2 rounded-lg text-[#111827] border border-[#D6CDC0]">
                          Call Seller
                        </div>
                        <div className="bg-[#0F5132] text-xs font-bold py-2 rounded-lg text-white">
                          WhatsApp Deal
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="flex-1 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] text-sm font-bold py-4 rounded-xl border border-[#D6CDC0] transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Edit Details</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] bg-gradient-to-r from-[#0F5132] to-[#0B3D26] hover:from-[#0B3D26] hover:to-[#073020] text-white text-base font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-[#FEF3C7]" />
                        <span>Publish Listing to Benue Marketplace</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
