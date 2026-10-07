import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Edit3, ShieldAlert } from 'lucide-react';
import { BENUE_LGAS, PRODUCE_CATEGORIES } from '../../constants/benue';
import { useProducts } from '../../context/ProductContext';
import { formatNaira, cleanNigerianPhoneForWhatsapp } from '../../utils/formatters';
import { uploadProduceImageToSupabase } from '../../services/productService';
import { compressImageFile } from '../../utils/imageCompressor';
import type { Product, BenueLGA, CategoryType, AvailabilityStatus } from '../../types';

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onSaveSuccess?: (updated: Product) => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  product,
  onClose,
  onSaveSuccess,
}) => {
  const { updateProduct } = useProducts();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState(() => ({
    name: product.name || '',
    category: (product.category || 'tubers') as CategoryType,
    description: product.description || '',
    price: product.price ? String(product.price) : '',
    unit: product.unit || '100kg Bag',
    quantity: product.quantity !== undefined ? String(product.quantity) : '100',
    minimumOrder: product.minimumOrder !== undefined ? String(product.minimumOrder) : '1',
    location: product.location || '',
    lga: (product.lga || 'Ukum') as BenueLGA,
    availability: (product.availability || 'in_stock') as AvailabilityStatus,
    imageUrl: product.images && product.images[0] ? product.images[0] : '',
    phone: product.sellerPhone || '',
    whatsapp: product.sellerWhatsapp || product.sellerPhone || '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let updatedImg = prev.imageUrl;
      if (name === 'category') {
        const cat = PRODUCE_CATEGORIES.find((c) => c.id === value);
        if (cat && cat.imageUrl && !prev.imageUrl.includes('supabase')) {
          updatedImg = cat.imageUrl;
        }
      }
      return { ...prev, [name]: value, imageUrl: updatedImg };
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const publicUrl = await uploadProduceImageToSupabase(file, 'produce');
      if (publicUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
      } else {
        const compressedDataUrl = await compressImageFile(file, 800, 800, 0.72);
        setFormData((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
      }
    } catch (err) {
      console.warn('Image upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Produce title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Valid price in Naira is required';
    if (!formData.unit.trim()) newErrors.unit = 'Unit is required (e.g. 100kg Bag)';
    if (!formData.location.trim()) newErrors.location = 'Market location is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const cleanedPhone = cleanNigerianPhoneForWhatsapp(formData.phone);
      const cleanedWhatsapp = cleanNigerianPhoneForWhatsapp(formData.whatsapp || formData.phone);

      const updated = await updateProduct(product.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: Number(formData.price),
        unit: formData.unit,
        quantity: Number(formData.quantity) || 1,
        minimumOrder: Number(formData.minimumOrder) || 1,
        location: formData.location,
        lga: formData.lga,
        availability: formData.availability,
        images: formData.imageUrl ? [formData.imageUrl] : product.images,
        sellerPhone: cleanedPhone,
        sellerWhatsapp: cleanedWhatsapp,
      });

      if (updated) {
        if (onSaveSuccess) onSaveSuccess(updated);
        onClose();
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update produce listing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="relative bg-white w-full max-w-2xl rounded-2xl border border-[#E8E2D9] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Decorator Bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#0F5132] via-[#F59E0B] to-[#0F5132]"></div>

      {/* Modal Header */}
      <div className="p-5 md:p-6 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FBF9F6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center font-bold shadow-xs">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider">
              Farmer Produce Manager
            </span>
            <h3 className="font-extrabold text-lg md:text-xl text-[#111827]">
              Edit Produce Listing
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="p-2 text-[#6B7280] hover:text-[#111827] rounded-full hover:bg-[#E8E2D9] transition-colors disabled:opacity-50"
          title="Close dialog (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Form Body */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
        {saveError && (
          <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Produce Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111827]">
            Produce Name / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Export Grade White Yam (Pona variety)"
            className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
          />
          {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
        </div>

        {/* Photo Section */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111827]">Produce Photo</label>
          <div className="flex items-center gap-3 bg-[#FBF9F6] p-3 rounded-xl border border-[#D6CDC0]">
            <div className="w-16 h-16 rounded-lg bg-gray-100 border border-[#E8E2D9] overflow-hidden flex-shrink-0 relative">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  No Image
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="inline-flex items-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingPhoto ? 'Uploading Photo...' : 'Replace Photo from Gallery'}</span>
              </button>
              <p className="text-[11px] text-[#4B5563]">
                Upload high-res photo from Benue farm or market (Supabase Storage).
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Category & Availability Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Agricultural Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            >
              {PRODUCE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Availability Status <span className="text-red-500">*</span>
            </label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            >
              <option value="in_stock">In Stock / Ready for Pickup</option>
              <option value="harvesting_soon">Harvesting Soon (Pre-Order)</option>
              <option value="sold_out">Sold Out (Temporarily Unavailable)</option>
            </select>
          </div>
        </div>

        {/* Pricing & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Price in Naira (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              min="1"
              required
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 85000"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
            {formData.price && (
              <p className="text-[11px] text-[#0F5132] font-semibold">
                Formatted: {formatNaira(Number(formData.price))}
              </p>
            )}
            {errors.price && <p className="text-xs text-red-600 font-medium">{errors.price}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Trading Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="unit"
              required
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g. 100 Tubers, 100kg Bag, Tonne"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
            {errors.unit && <p className="text-xs text-red-600 font-medium">{errors.unit}</p>}
          </div>
        </div>

        {/* Quantity & Minimum Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Available Quantity in Stock
            </label>
            <input
              type="number"
              name="quantity"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g. 50"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Minimum Order Quantity
            </label>
            <input
              type="number"
              name="minimumOrder"
              min="1"
              value={formData.minimumOrder}
              onChange={handleChange}
              placeholder="e.g. 5"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>
        </div>

        {/* LGA & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Benue State LGA <span className="text-red-500">*</span>
            </label>
            <select
              name="lga"
              value={formData.lga}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            >
              {BENUE_LGAS.map((lga) => (
                <option key={lga.name} value={lga.name}>
                  {lga.name} LGA ({lga.majorMarket})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Market / Farm Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Zaki Biam International Yam Market"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
            {errors.location && <p className="text-xs text-red-600 font-medium">{errors.location}</p>}
          </div>
        </div>

        {/* Contact Phone & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              Direct Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 08031234567"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
            {errors.phone && <p className="text-xs text-red-600 font-medium">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">
              WhatsApp Number (for instant trade deals)
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="e.g. 08031234567 (optional)"
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#111827]">
            Produce Description & Quality Details <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            rows={3}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe produce freshness, harvest date, preservation method, grade, or pickup details..."
            className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
          />
          {errors.description && <p className="text-xs text-red-600 font-medium">{errors.description}</p>}
        </div>

        {/* Form Actions Footer */}
        <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-[#D6CDC0] text-xs font-bold text-[#4B5563] hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploadingPhoto}
            className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#F59E0B]" />
            <span>{isSaving ? 'Saving Changes to Supabase...' : 'Save Produce Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (updated: Product) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={() => onClose()}
      role="dialog"
      aria-modal="true"
    >
      <EditProductForm
        key={product.id}
        product={product}
        onClose={onClose}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  );
};
