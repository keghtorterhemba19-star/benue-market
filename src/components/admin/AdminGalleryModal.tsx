import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  Trash2,
  Maximize2,
  ShieldCheck,
  Shield,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  Download,
  Star,
} from 'lucide-react';
import type { User } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';
import { uploadMediaToSupabaseBucket } from '../../services/productService';

interface AdminGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: User;
  onUpdateGallery: (userId: string, gallery: string[], newAvatarUrl?: string) => Promise<void>;
  isCurrentAdminLoggedIn: boolean;
  isSuperAdmin: boolean;
}

const PRESET_AVATARS = [
  {
    title: 'Executive Leader',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  },
  {
    title: 'Operations Manager',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
  },
  {
    title: 'Agricultural Supervisor',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
  },
  {
    title: 'Field Logistics Officer',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
  },
  {
    title: 'Corporate Director',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600',
  },
  {
    title: 'Regional Audit Lead',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600',
  },
];

export const AdminGalleryModal: React.FC<AdminGalleryModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  onUpdateGallery,
  isCurrentAdminLoggedIn: _isCurrentAdminLoggedIn,
  isSuperAdmin: _isSuperAdmin,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'presets'>('gallery');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const userGallery = adminUser.gallery && adminUser.gallery.length > 0
    ? adminUser.gallery
    : adminUser.profileImage
    ? [adminUser.profileImage]
    : [];

  const currentAvatar = adminUser.profileImage || userGallery[0];
  const isSuper = adminUser.role === 'super_admin' || adminUser.isSuperAdmin;

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Set selected photo as main avatar
  const handleSetAvatar = async (imgUrl: string) => {
    try {
      const updatedGallery = userGallery.includes(imgUrl)
        ? userGallery
        : [imgUrl, ...userGallery];
      
      await onUpdateGallery(adminUser.id, updatedGallery, imgUrl);
      triggerToast('✨ Profile Avatar updated successfully!');
    } catch (err) {
      console.error('Failed to set avatar:', err);
    }
  };

  // Delete photo from gallery
  const handleDeletePhoto = async (imgUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedGallery = userGallery.filter((url) => url !== imgUrl);
    let newAvatar = adminUser.profileImage;
    if (adminUser.profileImage === imgUrl) {
      newAvatar = updatedGallery.length > 0 ? updatedGallery[0] : '';
    }
    await onUpdateGallery(adminUser.id, updatedGallery, newAvatar);
    if (lightboxImage === imgUrl) {
      setLightboxImage(null);
    }
    triggerToast('🗑️ Photo removed from gallery');
  };

  // Handle local file upload & compressed base64 conversion
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        triggerToast('⚠️ Please select a valid image file');
        return;
      }

      let newImageUrl: string | null = null;
      // Try Supabase Storage first
      const result = await uploadMediaToSupabaseBucket(file, 'avatars');
      if (result.url) {
        newImageUrl = result.url;
      } else {
        // High-efficiency fallback
        newImageUrl = await compressImageFile(file, 600, 600, 0.8);
      }

      if (newImageUrl) {
        // The newly uploaded photo immediately replaces the old avatar
        const updatedGallery = [newImageUrl, ...userGallery.filter((url) => url !== newImageUrl)];
        await onUpdateGallery(adminUser.id, updatedGallery, newImageUrl);
        triggerToast('✨ New administrator avatar uploaded & active!');
        setActiveTab('gallery');
      }
    } catch (err) {
      console.error('File upload error:', err);
      triggerToast('⚠️ Failed to process image upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle URL Add
  const handleAddUrlImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image')) {
      setUrlError('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    setUrlError(null);
    const updatedGallery = [trimmed, ...userGallery.filter((url) => url !== trimmed)];
    await onUpdateGallery(adminUser.id, updatedGallery, trimmed);
    setUrlInput('');
    triggerToast('🌐 Photo URL added and set as active avatar!');
    setActiveTab('gallery');
  };

  // Add preset photo to gallery
  const handleAddPreset = async (presetUrl: string) => {
    const updatedGallery = [presetUrl, ...userGallery.filter((url) => url !== presetUrl)];
    await onUpdateGallery(adminUser.id, updatedGallery, presetUrl);
    triggerToast('⭐ Preset photo set as active avatar!');
    setActiveTab('gallery');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Toast alert inside modal */}
      {successToast && (
        <div className="fixed top-6 right-6 z-60 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-[#FEAE3A]" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Gradient Decorative Bar */}
        <div className="h-2 bg-gradient-to-r from-[#0F5132] via-[#FEAE3A] to-[#25D366] shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#FAF8F5] to-white border-b border-[#E8E2D9] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-md ${
                isSuper ? 'bg-[#FEAE3A] text-[#111827]' : 'bg-[#0F5132] text-white'
              }`}
            >
              {isSuper ? '👑' : '🛡️'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] tracking-tight">
                  {adminUser.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                    isSuper
                      ? 'bg-[#FEAE3A]/20 text-[#855400] border border-[#FEAE3A]/50'
                      : 'bg-[#E8F5E9] text-[#0F5132] border border-[#C8E6C9]'
                  }`}
                >
                  {isSuper ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                  {isSuper ? 'Super Admin' : 'Staff Admin'}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                Admin Avatar & Photo Gallery Manager • {adminUser.lga || 'Makurdi'} HQ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Close Gallery Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Active Avatar Spotlight Card */}
          <div className="bg-gradient-to-br from-[#0F5132] to-[#042013] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-900/50">
            {/* Ambient Lighting */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#FEAE3A]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-5 z-10 w-full sm:w-auto">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden ring-4 ring-[#FEAE3A]/80 shadow-2xl bg-[#0A3622] flex items-center justify-center text-3xl font-extrabold text-[#FEAE3A]">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt={adminUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    adminUser.name.charAt(0)
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FEAE3A] text-[#111827] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white"
                  title="Upload New Avatar Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEAE3A] text-[#111827] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-[#111827]" />
                    Active Profile Picture
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {adminUser.name}
                </h3>
                <p className="text-xs text-emerald-200/90 font-medium max-w-sm">
                  This picture represents your administrator avatar across the marketplace navbar, admin logs, and system console.
                </p>
              </div>
            </div>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto z-10 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 bg-[#FEAE3A] hover:bg-[#F59E0B] text-[#111827] text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/20 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#FEAE3A]" />
                <span>Choose Preset</span>
              </button>

              {currentAvatar && (
                <button
                  type="button"
                  onClick={async () => {
                    const filtered = userGallery.filter((u) => u !== adminUser.profileImage);
                    await onUpdateGallery(adminUser.id, filtered, '');
                    triggerToast('🗑️ Profile picture removed, initials restored');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold px-3 py-2.5 rounded-2xl border border-red-400/30 transition-all active:scale-95"
                  title="Remove avatar and use name initials"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-300" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Navigation Bar Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'gallery'
                  ? 'bg-[#0F5132] text-white shadow-sm'
                  : 'text-[#4B5563] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photo Gallery ({userGallery.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'upload'
                  ? 'bg-[#0F5132] text-white shadow-sm'
                  : 'text-[#4B5563] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload / Add Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'presets'
                  ? 'bg-[#0F5132] text-white shadow-sm'
                  : 'text-[#4B5563] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FEAE3A]" />
              <span>Preset Avatars</span>
            </button>
          </div>

          {/* TAB 1: GALLERY GRID VIEW */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {userGallery.length === 0 ? (
                <div className="text-center py-12 px-4 bg-[#FAF8F5] rounded-3xl border border-dashed border-[#D6CDC0]">
                  <div className="w-16 h-16 bg-[#E8F5E9] text-[#0F5132] rounded-3xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
                    📷
                  </div>
                  <h3 className="font-extrabold text-base text-[#111827]">Your Photo Gallery is Empty</h3>
                  <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                    Upload pictures from your device, enter an image URL, or choose from our curated admin presets to build your administrator gallery.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-[#FEAE3A]" />
                    <span>Upload First Photo</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userGallery.map((imgUrl, index) => {
                    const isCurrent = currentAvatar === imgUrl;

                    return (
                      <div
                        key={index}
                        className={`group relative aspect-square rounded-3xl overflow-hidden border transition-all duration-300 shadow-sm hover:shadow-xl ${
                          isCurrent
                            ? 'border-[#FEAE3A] ring-4 ring-[#FEAE3A]/40'
                            : 'border-[#E8E2D9] hover:border-[#0F5132]'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Admin gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />

                        {/* Top Badge: Active Avatar */}
                        {isCurrent && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-[#FEAE3A] text-[#111827] shadow-md uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Active Avatar
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between z-20">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLightboxImage(imgUrl)}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
                              title="Expand Lightbox Preview"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeletePhoto(imgUrl, e)}
                              className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {!isCurrent ? (
                            <button
                              type="button"
                              onClick={() => handleSetAvatar(imgUrl)}
                              className="w-full bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-bold py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Star className="w-3.5 h-3.5 text-[#FEAE3A]" />
                              <span>Set as Avatar</span>
                            </button>
                          ) : (
                            <div className="w-full bg-[#FEAE3A] text-[#111827] text-[11px] font-black py-1.5 rounded-xl text-center shadow-xs">
                              ⭐ Current Avatar
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD & ADD PHOTO VIEW */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop File Upload Card */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-300 ${
                  dragOver
                    ? 'border-[#0F5132] bg-[#E8F5E9]/50 scale-[1.01]'
                    : 'border-[#D6CDC0] hover:border-[#0F5132] bg-[#FAF8F5] hover:bg-white'
                }`}
              >
                <div className="w-16 h-16 bg-[#E8F5E9] text-[#0F5132] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="font-extrabold text-base text-[#111827]">
                  {isUploading ? 'Encoding & Uploading Picture...' : 'Drag & Drop Images Here'}
                </h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                  Support JPEG, PNG, WEBP, or GIF formats. Upload directly from your computer or mobile device.
                </p>

                <button
                  type="button"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4 text-[#FEAE3A]" />
                  <span>{isUploading ? 'Processing...' : 'Browse Device Files'}</span>
                </button>
              </div>

              {/* Alternative: Direct Image URL Form */}
              <div className="bg-[#FAF8F5] p-5 rounded-3xl border border-[#E8E2D9] space-y-3">
                <div className="flex items-center gap-2 text-[#111827] font-extrabold text-xs uppercase tracking-wider">
                  <LinkIcon className="w-4 h-4 text-[#0F5132]" />
                  <span>Or Add Photo via Direct Image Web URL</span>
                </div>

                <form onSubmit={handleAddUrlImage} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-example.jpg"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlError(null);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-[#D6CDC0] rounded-2xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
                    />
                    {urlError && <p className="text-[11px] text-red-600 mt-1 font-semibold">{urlError}</p>}
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    Add URL Photo
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: PRESETS LIBRARY */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-[#6B7280] font-medium">
                Choose a pre-styled high resolution avatar photo to instantly add to your gallery and set as your active profile picture:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PRESET_AVATARS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-3 flex flex-col justify-end">
                        <span className="text-xs font-extrabold text-white">{preset.title}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF8F5]">
                      <button
                        type="button"
                        onClick={() => handleAddPreset(preset.url)}
                        className="w-full bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-bold py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FEAE3A]" />
                        <span>Use This Preset</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#E8E2D9] flex items-center justify-between gap-4 shrink-0">
          <span className="text-xs text-[#6B7280] font-medium">
            {userGallery.length} photo(s) total in {adminUser.name}'s gallery
          </span>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#111827] hover:bg-black text-white text-xs font-extrabold px-6 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
          >
            Done & Save
          </button>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL */}
      {lightboxImage && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all border border-white/30 z-80"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={lightboxImage}
              alt="Expanded photo preview"
              className="max-h-[70vh] w-auto object-contain rounded-3xl shadow-2xl border border-white/20"
            />

            <div className="mt-5 flex items-center gap-3">
              {currentAvatar !== lightboxImage && (
                <button
                  type="button"
                  onClick={() => {
                    handleSetAvatar(lightboxImage);
                    setLightboxImage(null);
                  }}
                  className="bg-[#FEAE3A] hover:bg-[#F59E0B] text-[#111827] text-xs font-black px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transition-all active:scale-95"
                >
                  <Star className="w-4 h-4 fill-[#111827]" />
                  <span>Set as Active Avatar</span>
                </button>
              )}

              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                download="admin-photo.jpg"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/30 flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Open Full Size</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
