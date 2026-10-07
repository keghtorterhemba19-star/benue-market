import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Image, Sparkles, Check, RefreshCw, ZoomIn, Sliders, ShieldCheck, MapPin, UserCheck, FileText, Phone, Building, KeyRound, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { User, BenueLGA, SellerAvailability } from '../../types';
import { BENUE_LGAS } from '../../constants/benue';
import { useAuth } from '../../context/AuthContext';
import { compressImageFile } from '../../utils/imageCompressor';

interface ProfileCoverEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaveCover: (coverUrl: string) => void;
  onSaveAvatar: (avatarUrl: string) => void;
  onSaveProfileDetails?: (details: {
    name?: string;
    phone?: string;
    whatsapp?: string;
    lga?: BenueLGA;
    location?: string;
    bio?: string;
    availabilityStatus?: SellerAvailability;
  }) => void;
  isBuyerMode?: boolean;
}


// Preset Benue agricultural high-res covers
export const FARM_COVER_PRESETS = [
  {
    id: 'preset-1',
    name: 'Zaki Biam Yam Harvest',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600',
    description: 'Lush green agricultural land representing rich soil & bumper harvests.',
  },
  {
    id: 'preset-2',
    name: 'Gboko Golden Grain Fields',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1600',
    description: 'Golden sun setting over boundless maize & soybean cereal fields.',
  },
  {
    id: 'preset-3',
    name: 'River Benue Waterfront',
    url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1600',
    description: 'Scenic river basin irrigation & aquaculture green pastures.',
  },
  {
    id: 'preset-4',
    name: 'Makurdi Citrus Groves',
    url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1600',
    description: 'Sleek, vibrant orange & vegetable farm rows under clear blue skies.',
  },
  {
    id: 'preset-5',
    name: 'Sunrise Farmstead',
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1600',
    description: 'Early morning farm gate morning glow over fresh produce fields.',
  },
];

export const ProfileCoverEditModal: React.FC<ProfileCoverEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveCover,
  onSaveAvatar,
  onSaveProfileDetails,
  isBuyerMode = false,
}) => {
  const { changePassword, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'cover' | 'avatar' | 'details' | 'security'>('cover');
  const [selectedCover, setSelectedCover] = useState<string>(
    currentUser?.coverImage || FARM_COVER_PRESETS[0].url
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    currentUser?.profileImage || ''
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [objectPosition, setObjectPosition] = useState<string>('center');

  // Form Details State
  const [formName, setFormName] = useState<string>(currentUser?.name || '');
  const [formPhone, setFormPhone] = useState<string>(currentUser?.phone || '');
  const [formWhatsapp, setFormWhatsapp] = useState<string>(currentUser?.whatsapp || currentUser?.phone || '');
  const [formLga, setFormLga] = useState<BenueLGA>(currentUser?.lga || 'Ukum');
  const [formLocation, setFormLocation] = useState<string>(currentUser?.location || '');
  const [formBio, setFormBio] = useState<string>(currentUser?.bio || '');
  const [formAvailability, setFormAvailability] = useState<SellerAvailability>(
    currentUser?.availabilityStatus || 'available'
  );

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSelectedCover(currentUser.coverImage || FARM_COVER_PRESETS[0].url);
      setSelectedAvatar(currentUser.profileImage || '');
      setFormName(currentUser.name || '');
      setFormPhone(currentUser.phone || '');
      setFormWhatsapp(currentUser.whatsapp || currentUser.phone || '');
      setFormLga(currentUser.lga || 'Ukum');
      setFormLocation(currentUser.location || '');
      setFormBio(currentUser.bio || '');
      setFormAvailability(currentUser.availabilityStatus || 'available');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'avatar') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImageFile(
          file,
          type === 'avatar' ? 400 : 1200,
          type === 'avatar' ? 400 : 800,
          0.8
        );
        if (type === 'cover') {
          setSelectedCover(compressedDataUrl);
        } else {
          setSelectedAvatar(compressedDataUrl);
        }
      } catch (err) {
        console.error('Failed to compress uploaded image:', err);
      }
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (currentUser) {
      const res = await changePassword(currentUser.id, newPassword);
      if (res.success) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    }
  };

  const handleSaveAll = () => {
    if (currentUser?.id) {
      updateUserProfile(currentUser.id, {
        coverImage: selectedCover,
        profileImage: selectedAvatar,
        ...(isBuyerMode
          ? {}
          : {
              name: formName,
              phone: formPhone,
              whatsapp: formWhatsapp,
              lga: formLga,
              location: formLocation,
              bio: formBio,
              availabilityStatus: formAvailability,
            }),
      });
    }
    onSaveCover(selectedCover);
    onSaveAvatar(selectedAvatar);
    if (onSaveProfileDetails && !isBuyerMode) {
      onSaveProfileDetails({
        name: formName,
        phone: formPhone,
        whatsapp: formWhatsapp,
        lga: formLga,
        location: formLocation,
        bio: formBio,
        availabilityStatus: formAvailability,
      });
    }
    onClose();
  };

  const getFilterStyle = () => {
    switch (selectedFilter) {
      case 'vibrant':
        return 'saturate-150 contrast-110';
      case 'warm':
        return 'sepia-[0.25] saturate-125 brightness-105';
      case 'earth':
        return 'contrast-125 brightness-95 hue-rotate-15';
      case 'grayscale':
        return 'grayscale contrast-125';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Top Decorative Header */}
        <div className="h-2 bg-gradient-to-r from-[#0F5132] via-[#B45309] to-[#10B981]" />

        {/* Modal Navigation Header */}
        <div className="p-5 md:p-6 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FBF9F6]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F5132]/10 text-[#0F5132] rounded-xl">
              <Sparkles className="w-5 h-5 text-[#0F5132]" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-[#111827]">
                {isBuyerMode ? 'Buyer Profile & Avatar Customization' : 'Account & Profile Settings'}
              </h2>
              <p className="text-xs text-[#4B5563]">
                {isBuyerMode
                  ? 'Customize your buyer avatar picture & profile header cover banner.'
                  : 'Edit cover banner, avatar, farm status, details & passwords.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-[#E8E2D9] bg-white px-6 pt-3 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-2 pb-3 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cover'
                ? 'border-[#0F5132] text-[#0F5132]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Cover Banner</span>
          </button>

          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-2 pb-3 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'avatar'
                ? 'border-[#0F5132] text-[#0F5132]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Profile Avatar</span>
          </button>

          {!isBuyerMode && (
            <>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-2 pb-3 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-[#0F5132] text-[#0F5132]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Farm & Account Info</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 pb-3 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-[#0F5132] text-[#0F5132]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            </>
          )}
        </div>


        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FBF9F6]">
          {/* Live Interactive Header Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B45309]" /> Instant Live Preview
              </span>
              <span className="text-[11px] text-gray-500">
                Auto-refreshes without reloading page
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-[#E8E2D9] bg-[#003b21] shadow-md group">
              {/* Cover Banner Area */}
              <div className="h-40 md:h-48 w-full relative overflow-hidden bg-gradient-to-r from-[#0F5132] to-[#115433]">
                {selectedCover ? (
                  <img
                    src={selectedCover}
                    alt="Cover Banner"
                    className={`w-full h-full object-cover transition-all duration-300 ${getFilterStyle()}`}
                    style={{
                      transform: `scale(${zoomLevel / 100})`,
                      objectPosition: objectPosition,
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-semibold">
                    No Cover Banner Selected
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Overlapping Profile Info Bar */}
              <div className="relative px-6 pb-5 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 z-10">
                <div className="flex items-end gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-extrabold text-3xl ring-4 ring-white shadow-xl overflow-hidden">
                      {selectedAvatar ? (
                        <img
                          src={selectedAvatar}
                          alt="Avatar"
                          className={`w-full h-full object-cover ${activeTab === 'avatar' ? getFilterStyle() : ''}`}
                        />
                      ) : (
                        (formName || currentUser?.name || 'F').charAt(0)
                      )}
                    </div>
                  </div>

                  <div className="text-white space-y-1 pb-1 drop-shadow-md">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg md:text-xl text-white leading-tight">
                        {formName || currentUser?.name || 'Benue Producer'}
                      </h3>
                      {currentUser?.isVerified && (
                        <ShieldCheck className="w-5 h-5 text-[#10B981] fill-[#0F5132]/40" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-200">
                      <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{formLocation || currentUser?.location || `${formLga} LGA, Benue State`}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Real-Time Sync Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Specific Editing Controls */}
          {activeTab === 'cover' ? (
            <div className="space-y-6">
              {/* Cover Upload Trigger & Presets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Device Upload Option */}
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="bg-white p-5 rounded-2xl border-2 border-dashed border-[#0F5132]/30 hover:border-[#0F5132] cursor-pointer transition-all flex flex-col items-center justify-center text-center group hover:bg-[#E8F5E9]/50"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-extrabold text-sm text-[#111827]">Upload Custom Cover Picture</span>
                  <p className="text-xs text-[#4B5563] mt-1">
                    Select high-resolution photo from device gallery (PNG, JPG, WEBP)
                  </p>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={(e) => handleFileUpload(e, 'cover')}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Preset Banner Selector info */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Quick Presets</span>
                    <h4 className="font-extrabold text-sm text-[#111827] mt-0.5">High-Res Benue Farmland Presets</h4>
                    <p className="text-xs text-[#4B5563] mt-1">
                      Choose from our professionally curated agricultural header banners for Benue market sellers.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCover(FARM_COVER_PRESETS[0].url)}
                    className="text-xs font-bold text-[#0F5132] hover:underline self-start mt-3 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Default Banner</span>
                  </button>
                </div>
              </div>

              {/* Preset Gallery Grid */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-[#111827] uppercase tracking-wider">
                  Select High-Res Farm Cover Preset
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {FARM_COVER_PRESETS.map((preset) => {
                    const isSelected = selectedCover === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedCover(preset.url)}
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                          isSelected
                            ? 'border-[#0F5132] ring-2 ring-[#0F5132]/30 scale-[1.02]'
                            : 'border-transparent hover:border-[#0F5132]/50'
                        }`}
                      >
                        <div className="h-20 w-full overflow-hidden">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-[#0F5132] text-white p-1 rounded-full shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="p-1.5 bg-white text-center">
                          <span className="text-[10px] font-bold text-[#111827] truncate block">
                            {preset.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Image Fine-Tuning Controls */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
                  <Sliders className="w-4 h-4 text-[#0F5132]" />
                  <span className="font-extrabold text-xs text-[#111827] uppercase tracking-wider">
                    Banner Zoom & Filter Adjustments
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Zoom Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3.5 h-3.5 text-[#0F5132]" /> Zoom Level
                      </span>
                      <span className="text-[#0F5132]">{zoomLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="220"
                      step="5"
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(Number(e.target.value))}
                      className="w-full accent-[#0F5132] cursor-pointer"
                    />
                  </div>

                  {/* Object Position */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">Vertical Focus Position</span>
                    <div className="flex items-center gap-2">
                      {['top', 'center', 'bottom'].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setObjectPosition(pos)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                            objectPosition === pos
                              ? 'bg-[#0F5132] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">Color Filter Preset</span>
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                    >
                      <option value="none">Original High-Def</option>
                      <option value="vibrant">Emerald Crisp (Vibrant Green)</option>
                      <option value="warm">Golden Harvest (Sunset Warmth)</option>
                      <option value="earth">Benue Rich Soil (Deep Contrast)</option>
                      <option value="grayscale">Classic Vintage B&W</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'avatar' ? (
            <div className="space-y-6">
              {/* Avatar Upload Box */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-28 h-28 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-extrabold text-4xl ring-4 ring-[#C8E6C9] overflow-hidden shadow-md">
                    {selectedAvatar ? (
                      <img src={selectedAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      (formName || currentUser?.name || 'F').charAt(0)
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 bg-[#B45309] text-white p-2 rounded-full shadow-lg hover:bg-[#0F5132] transition-colors border-2 border-white"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 max-w-sm">
                  <h4 className="font-extrabold text-base text-[#111827]">Upload Profile Avatar</h4>
                  <p className="text-xs text-[#4B5563]">
                    Your profile picture is displayed on all produce listings, merchant inquiries, and public farmer profiles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo from Device</span>
                </button>

                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          ) : activeTab === 'details' ? (
            /* Farm & User Profile Details Form */
            <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] space-y-6">
              <div className="border-b border-[#E8E2D9] pb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-[#111827]">Farm & Seller Credentials</h4>
                  <p className="text-xs text-[#4B5563]">
                    Changes will reactively update across your listings, dashboard, and public store profile.
                  </p>
                </div>
                <UserCheck className="w-5 h-5 text-[#0F5132]" />
              </div>

              {/* Seller Availability Status Toggle */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
                <label className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0F5132]" /> Seller Storefront Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormAvailability('available')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      formAvailability === 'available'
                        ? 'bg-[#E8F5E9] text-[#0F5132] border-[#C8E6C9] ring-2 ring-[#0F5132]'
                        : 'bg-white text-[#4B5563] border-[#E8E2D9]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span>Available & Taking Orders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAvailability('away')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      formAvailability === 'away'
                        ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] ring-2 ring-[#B45309]'
                        : 'bg-white text-[#4B5563] border-[#E8E2D9]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                    <span>Away / Off-Season</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Farm / User Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#0F5132]" /> Farm / Producer Business Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tor-Anyam Farmers Union"
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0F5132]" /> Phone Number (Direct Calls)
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#10B981]" /> WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="08031234567"
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                {/* Benue LGA Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B45309]" /> Local Government Area (LGA)
                  </label>
                  <select
                    value={formLga}
                    onChange={(e) => setFormLga(e.target.value as BenueLGA)}
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  >
                    {BENUE_LGAS.map((lgaObj) => (
                      <option key={lgaObj.name} value={lgaObj.name}>
                        {lgaObj.name} LGA ({lgaObj.majorMarket})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Location / Address */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0F5132]" /> Specific Farm Location / Market Hub
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Zaki Biam Central Yam Market, Ukum LGA"
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                {/* Farm Bio / Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0F5132]" /> About Agricultural Operations & Produce
                  </label>
                  <textarea
                    rows={3}
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Describe your agricultural produces, member farmers, or supply capacity..."
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Change Password Security Form */
            <form onSubmit={handleSavePassword} className="bg-white p-6 rounded-2xl border border-[#E8E2D9] space-y-5">
              <div className="border-b border-[#E8E2D9] pb-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-[#111827]">Change Account Password</h4>
                  <p className="text-xs text-[#4B5563]">
                    Update your password to keep your producer account secure.
                  </p>
                </div>
                <KeyRound className="w-5 h-5 text-[#0F5132]" />
              </div>

              {passwordMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827]">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full text-xs font-bold bg-[#FBF9F6] border border-[#E8E2D9] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0F5132] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#FEF3C7]" />
                  <span>Update Password Now</span>
                </button>
              </div>
            </form>
          )}
        </div>


        {/* Modal Action Footer */}
        <div className="p-5 border-t border-[#E8E2D9] bg-white flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save & Self-Refresh Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
