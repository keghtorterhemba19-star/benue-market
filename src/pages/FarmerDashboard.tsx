import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ShieldCheck, LogOut, Camera, Upload, Trash2, CheckCircle2, Edit3, Star, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { formatNaira } from '../utils/formatters';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditProductModal } from '../components/marketplace/EditProductModal';
import { ProfileCoverEditModal } from '../components/farmer/ProfileCoverEditModal';
import { AdvertiseProductModal } from '../components/marketplace/AdvertiseProductModal';
import type { Product } from '../types';

export const FarmerDashboard: React.FC = () => {
  const { currentUser, logout, updateProfileImage, updateCoverImage, updateUserProfile, toggleAvailabilityStatus } = useAuth();
  const { getProductsBySeller, deleteProduct, updateSellerInfoInProducts } = useProducts();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToAdvertise, setProductToAdvertise] = useState<Product | null>(null);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const farmerListings = getProductsBySeller(currentUser?.id || 'farmer-1');

  const handleAvatarClick = () => {
    setIsCoverModalOpen(true);
  };

  const handleConfirmDelete = (productId: string) => {
    const deletedItemName = productToDelete?.name || 'Produce listing';
    deleteProduct(productId);
    setToastMessage(`"${deletedItemName}" has been deleted from your marketplace listings.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F5132] text-white px-4 py-3 rounded-xl shadow-lg border border-[#C8E6C9]/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={productToDelete}
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Edit Produce Modal */}
      <EditProductModal
        product={productToEdit}
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        onSaveSuccess={(updated) => {
          setToastMessage(`"${updated.name}" updated successfully.`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Advertise Product Modal */}
      <AdvertiseProductModal
        product={productToAdvertise}
        isOpen={!!productToAdvertise}
        onClose={() => setProductToAdvertise(null)}
        vendorEmail={currentUser?.email || ''}
        vendorId={currentUser?.id || ''}
        onSuccess={() => {
          setToastMessage('🎉 Product advertisement activated! It will now appear in the Sponsored section.');
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Profile Cover & Avatar Edit Modal */}
      <ProfileCoverEditModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        currentUser={currentUser}
        onSaveCover={(coverUrl) => {
          updateCoverImage(coverUrl);
          setToastMessage('Farm cover banner updated in real-time!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onSaveAvatar={(avatarUrl) => {
          updateProfileImage(avatarUrl);
          setToastMessage('Profile avatar updated in real-time!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onSaveProfileDetails={(details) => {
          if (currentUser?.id) {
            updateUserProfile(currentUser.id, details);
            updateSellerInfoInProducts(currentUser.id, {
              sellerName: details.name,
              sellerPhone: details.phone,
              sellerWhatsapp: details.whatsapp,
              lga: details.lga,
              location: details.location,
            });
            setToastMessage('Farm profile & listings self-refreshed in real-time!');
            setTimeout(() => setToastMessage(null), 4000);
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        {/* Farmer Cover Photo & Profile Banner Header */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden relative group">
          {/* Cover Picture Banner */}
          <div className="h-44 sm:h-56 md:h-64 w-full relative overflow-hidden bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26]">
            <img
              src={currentUser?.coverImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600'}
              alt="Farm Cover Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Edit Cover Photo Floating Glassmorphism Button */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(true)}
                className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95"
                title="Edit farm cover picture banner"
              >
                <Camera className="w-4 h-4 text-[#F59E0B]" />
                <span className="hidden sm:inline">Edit Cover Photo</span>
              </button>
            </div>
          </div>

          {/* Overlapping Profile Info Bar */}
          <div className="p-6 md:p-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 sm:-mt-16 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar with Camera Badge */}
              <div
                className="relative group cursor-pointer shrink-0 self-start sm:self-auto"
                onClick={handleAvatarClick}
                title="Click to edit profile picture or cover"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl ring-4 ring-white shadow-2xl overflow-hidden bg-cover bg-center">
                  {currentUser?.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name || 'Producer'} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.charAt(0) || 'F'
                  )}
                </div>

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-7 h-7 text-white" />
                </div>

                <button
                  type="button"
                  className="absolute bottom-1 right-1 bg-[#B45309] text-white p-2 rounded-full shadow-lg hover:bg-[#0F5132] transition-colors border-2 border-white"
                  title="Upload profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Farmer Info Details */}
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FDE68A]">
                    {currentUser?.userType ? `${currentUser.userType} Hub` : 'Producer / Seller Dashboard'}
                  </span>
                  {currentUser?.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0F5132] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md border border-[#C8E6C9]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                      <span>Verified Benue Producer</span>
                    </span>
                  )}
                </div>

                <h1 className="font-extrabold text-2xl sm:text-3xl text-[#111827]">{currentUser?.name}</h1>

                <p className="text-xs sm:text-sm text-[#4B5563] font-medium flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span>📍 {currentUser?.location || 'Zaki Biam Yam Market, Ukum LGA'}</span>
                  <span>•</span>
                  <span>📞 {currentUser?.phone}</span>
                </p>

                <button
                  onClick={() => setIsCoverModalOpen(true)}
                  className="text-xs font-extrabold text-[#0F5132] hover:text-[#0B3D26] hover:underline flex items-center gap-1 pt-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Customize Cover Banner & Avatar</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
              <Link
                to="/sell-produce"
                className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-3 rounded-xl shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Add New Produce Listing</span>
              </Link>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 bg-[#FBF9F6] text-red-600 border border-red-200 text-xs sm:text-sm font-bold px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Active Public Listings</span>
            <div className="font-extrabold text-3xl text-[#0F5132]">{farmerListings.length}</div>
            <p className="text-[11px] text-[#B45309] font-medium">Visible to buyers across Nigeria</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Seller Rating & Reviews</span>
            <div className="font-extrabold text-2xl text-[#D97706] flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
              <span>{currentUser?.averageRating ? currentUser.averageRating.toFixed(1) : '4.9'}</span>
              <span className="text-xs text-[#6B7280] font-semibold">({currentUser?.reviewCount || 12} reviews)</span>
            </div>
            <Link to={`/farmer/${currentUser?.id || 'farmer-1'}`} className="text-[11px] text-[#0F5132] font-bold hover:underline block pt-0.5">
              View public store & reviews →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Availability Status</span>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.id) {
                    const newStatus = (currentUser.availabilityStatus || 'available') === 'available' ? 'away' : 'available';
                    toggleAvailabilityStatus(currentUser.id, newStatus);
                    setToastMessage(`Your status is now set to "${newStatus === 'available' ? 'Available & Taking Orders' : 'Away / Off-Season'}".`);
                    setTimeout(() => setToastMessage(null), 4000);
                  }
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all border shadow-sm ${
                  (currentUser?.availabilityStatus || 'available') === 'available'
                    ? 'bg-[#E8F5E9] text-[#0F5132] border-[#C8E6C9] hover:bg-[#C8E6C9]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] hover:bg-[#FDE68A]'
                }`}
                title="Click to toggle availability status for buyers"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${ (currentUser?.availabilityStatus || 'available') === 'available' ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
                <span>{(currentUser?.availabilityStatus || 'available') === 'available' ? 'Available & Taking Orders' : 'Away / Off-Season'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#6B7280] font-medium pt-0.5">Click badge to toggle buyer status</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Marketplace Status</span>
            <div className="font-extrabold text-2xl text-[#0F5132] flex items-center gap-1.5">
              <ShieldCheck className="w-6 h-6 text-[#0F5132]" />
              <span>Verified Seller</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">Joined {currentUser?.joinedDate || 'September 2023'}</p>
          </div>
        </div>

        {/* Active Produce Table */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl text-[#0F5132]">My Active Produce Listings</h3>
            <Link
              to="/sell-produce"
              className="text-xs font-bold text-[#0F5132] hover:underline"
            >
              + Create New Listing
            </Link>
          </div>

          {farmerListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#E8F5E9] text-[#0F5132] font-bold border-b border-[#C8E6C9]">
                    <th className="p-3">Produce Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price / Unit</th>
                    <th className="p-3">Available</th>
                    <th className="p-3">Location & LGA</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {farmerListings.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FBF9F6]">
                      <td className="p-3 font-bold text-[#111827] flex items-center gap-2">
                        <img src={item.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#E8E2D9]" />
                        <Link to={`/product/${item.id}`} className="hover:text-[#0F5132]">
                          {item.name}
                        </Link>
                      </td>
                      <td className="p-3 uppercase font-semibold text-[#B45309]">{item.category}</td>
                      <td className="p-3 font-bold text-[#0F5132]">{formatNaira(item.price)} / {item.unit}</td>
                      <td className="p-3 text-[#4B5563]">{item.quantity} units</td>
                      <td className="p-3 text-[#4B5563]">{item.location} ({item.lga})</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            to={`/product/${item.id}`}
                            className="text-[#0F5132] font-bold hover:underline px-2 py-1"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductToAdvertise(item)}
                            className="inline-flex items-center gap-1 text-[#B45309] hover:text-[#92400E] font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
                            title="Advertise this product"
                          >
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>Advertise</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToEdit(item)}
                            className="inline-flex items-center gap-1 text-[#0F5132] hover:text-[#0B3D26] font-bold bg-[#E8F5E9] hover:bg-[#C8E6C9] px-2.5 py-1 rounded-lg border border-[#C8E6C9] transition-colors"
                            title="Edit listing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(item)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#4B5563]">
              You have no active produce listings yet. Click "Add New Produce Listing" above to publish your harvest.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
