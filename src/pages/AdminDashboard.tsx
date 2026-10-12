import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Store,
  ShoppingBag,
  Package,
  Activity,
  Plus,
  Trash2,
  Ban,
  CheckCircle2,
  Lock,
  Search,
  MapPin,
  Phone,
  Mail,
  Star,
  Sparkles,
  Eye,
  Settings,
  LogOut,
  ArrowRightLeft,
  ExternalLink,
  ArrowRight,
  Camera,
  Images,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Flag,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { BENUE_LGAS } from '../constants/benue';
import { formatNaira } from '../utils/formatters';
import type { User, Report } from '../types';
import type { Advertisement } from '../types/advertisement';
import { fetchAllAdvertisements } from '../services/advertisingService';
import { AddAdminModal } from '../components/admin/AddAdminModal';
import { UserActionConfirmModal, type UserActionType } from '../components/admin/UserActionConfirmModal';
import { AdminGalleryModal } from '../components/admin/AdminGalleryModal';
import { AdminReplyModal } from '../components/admin/AdminReplyModal';
import { AdminAdvertisingTab } from '../components/admin/AdminAdvertisingTab';
import { AdminAuditLogsTab } from '../components/admin/AdminAuditLogsTab';
import { Link, useNavigate } from 'react-router-dom';

type AdminTab = 'admins' | 'vendors' | 'buyers' | 'listings' | 'reports' | 'advertising' | 'logs' | 'settings' | 'security';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    users,
    activityLogs,
    reports = [],
    resolveReport,
    deleteReport,
    isSuperAdmin,
    addAdmin,
    deleteUser,
    toggleSuspendUser,
    toggleVerifyFarmer,
    updateUserGallery,
    reviewAccountReopen,
    logout,
  } = useAuth();

  const {
    products,
    deleteProduct,
    toggleFeatureProduct,
    deleteProductsBySeller,
  } = useProducts();

  const handleAdminLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [activeTab, setActiveTab] = useState<AdminTab>('admins');
  const [searchQuery, setSearchQuery] = useState('');
  const [lgaFilter, setLgaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [allAds, setAllAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    const loadAds = async () => {
      try {
        const ads = await fetchAllAdvertisements();
        setAllAds(ads);
      } catch {
        setAllAds([]);
      }
    };
    loadAds();
  }, [activeTab]);

  const activeAdsCount = useMemo(() => {
    return allAds.filter((a) => a.advertisementStatus === 'active').length;
  }, [allAds]);


  // Modals state
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [galleryModal, setGalleryModal] = useState<{
    isOpen: boolean;
    targetUser: User | null;
  }>({
    isOpen: false,
    targetUser: null,
  });

  const handleOpenGallery = (userToManage?: User) => {
    const target = userToManage || currentUser;
    if (target) {
      setGalleryModal({ isOpen: true, targetUser: target });
    }
  };
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    targetUser: User | null;
    actionType: UserActionType;
  }>({
    isOpen: false,
    targetUser: null,
    actionType: 'delete_vendor',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [reportCategoryFilter, setReportCategoryFilter] = useState<'all' | 'product' | 'seller' | 'pending' | 'resolved'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [replyModal, setReplyModal] = useState<{
    isOpen: boolean;
    report: Report | null;
  }>({
    isOpen: false,
    report: null,
  });

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesCategory =
        reportCategoryFilter === 'all'
          ? true
          : reportCategoryFilter === 'product'
          ? r.targetType === 'product'
          : reportCategoryFilter === 'seller'
          ? r.targetType === 'seller'
          : reportCategoryFilter === 'pending'
          ? r.status === 'pending'
          : r.status === 'resolved';

      const matchesSearch =
        !reportSearchQuery ||
        r.targetName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        r.details.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        (r.reporterName && r.reporterName.toLowerCase().includes(reportSearchQuery.toLowerCase())) ||
        (r.reporterEmail && r.reporterEmail.toLowerCase().includes(reportSearchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [reports, reportCategoryFilter, reportSearchQuery]);

  const handleSendAdminReply = async (reportId: string, _replyMessage: string) => {
    await resolveReport(reportId);
    showToast('✅ Executive administrative response dispatched & report resolved!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Grouped Users
  const staffAdmins = useMemo(() => {
    return users.filter((u) => u.role === 'admin' || u.role === 'super_admin');
  }, [users]);


  const vendors = useMemo(() => {
    return users.filter((u) => u.role === 'seller');
  }, [users]);

  const buyers = useMemo(() => {
    return users.filter((u) => u.role === 'buyer');
  }, [users]);

  const suspendedCount = useMemo(() => {
    return users.filter((u) => u.status === 'suspended').length;
  }, [users]);

  const pendingReopenRequests = useMemo(() => {
    return users.filter(
      (u) => u.reopenRequested || u.status === 'suspended' || Boolean(u.lockoutUntil && Date.now() < u.lockoutUntil)
    );
  }, [users]);

  const verifiedVendorsCount = useMemo(() => {
    return vendors.filter((v) => v.isVerified).length;
  }, [vendors]);

  const estimatedTradeVolume = useMemo(() => {
    return products.reduce((acc, p) => acc + p.price * Math.min(p.quantity, 10), 0);
  }, [products]);

  // Filtered lists based on search & LGA
  const filteredAdmins = useMemo(() => {
    return staffAdmins.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.phone.includes(q);
      const matchLga = lgaFilter === 'all' || a.lga === lgaFilter;
      const matchStatus = statusFilter === 'all' || (a.status || 'active') === statusFilter;
      return matchQuery && matchLga && matchStatus;
    });
  }, [staffAdmins, searchQuery, lgaFilter, statusFilter]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || v.phone.includes(q) || (v.location && v.location.toLowerCase().includes(q));
      const matchLga = lgaFilter === 'all' || v.lga === lgaFilter;
      const matchStatus = statusFilter === 'all' || (v.status || 'active') === statusFilter;
      return matchQuery && matchLga && matchStatus;
    });
  }, [vendors, searchQuery, lgaFilter, statusFilter]);

  const filteredBuyers = useMemo(() => {
    return buyers.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.phone.includes(q);
      const matchLga = lgaFilter === 'all' || b.lga === lgaFilter;
      const matchStatus = statusFilter === 'all' || (b.status || 'active') === statusFilter;
      return matchQuery && matchLga && matchStatus;
    });
  }, [buyers, searchQuery, lgaFilter, statusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.sellerName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchLga = lgaFilter === 'all' || p.lga === lgaFilter;
      return matchQuery && matchLga;
    });
  }, [products, searchQuery, lgaFilter]);

  // Handler for Confirm Modal
  const handleConfirmUserAction = async (userId: string, reason?: string) => {
    if (!isSuperAdmin) {
      showToast('❌ Access Denied: Only Super Admin can perform this action.');
      return;
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (actionModal.actionType.startsWith('delete_')) {
      if (actionModal.actionType === 'delete_vendor') {
        // Also cleanup products
        await deleteProductsBySeller(userId);
      }
      await deleteUser(userId);
      showToast(`✅ Successfully deleted ${target.name}`);
    } else if (actionModal.actionType === 'suspend_user' || actionModal.actionType === 'activate_user') {
      await toggleSuspendUser(userId, reason);
      showToast(`✅ Account status updated for ${target.name}`);
    }
  };

  const handleFarmerVerificationToggle = async (vendor: User) => {
    if (!isSuperAdmin) {
      showToast('🔒 Super Admin permission required to verify vendors.');
      return;
    }
    await toggleVerifyFarmer(vendor.id);
    showToast(`✅ Updated verification badge for ${vendor.name}`);
  };

  const handleProductDelete = async (productId: string) => {
    if (!isSuperAdmin) {
      showToast('🔒 Super Admin permission required to delete marketplace listings.');
      return;
    }
    await deleteProduct(productId);
    showToast('✅ Produce listing removed from marketplace');
  };


  const handleProductFeature = async (productId: string) => {
    if (!isSuperAdmin) {
      showToast('🔒 Super Admin permission required to feature produce.');
      return;
    }
    await toggleFeatureProduct(productId);
    showToast('✅ Produce spotlight status updated');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-[#FEAE3A]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F5132] via-[#0A3622] to-[#042013] text-white p-6 md:p-10 shadow-xl border border-emerald-900/40 mb-8">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-[#FEAE3A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              {isSuperAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FEAE3A] text-[#111827] shadow-sm tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SUPER ADMINISTRATOR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  STAFF MONITORING ADMIN
                </span>
              )}
              <span className="text-xs text-emerald-200/80 font-medium">
                Benue State Agricultural Network • Estimated Volume: {formatNaira(estimatedTradeVolume)}
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {isSuperAdmin ? 'Executive Management Console' : 'Platform Oversight Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              {isSuperAdmin
                ? 'Full executive authority to authorize staff admins, suspend & delete vendors/buyers, manage listings, and oversee agricultural commerce across all 23 Benue LGAs.'
                : 'Monitor-only access for operational auditing, market trends, and produce directory oversight.'}
            </p>
          </div>

          {/* User Profile & Session Controls Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div
              onClick={() => handleOpenGallery()}
              className="group bg-white/10 hover:bg-white/20 cursor-pointer backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/20 flex items-center gap-3 shadow-lg transition-all active:scale-95"
              title="Click to manage photo gallery and profile avatar"
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-[#FEAE3A] text-[#111827] font-extrabold text-lg flex items-center justify-center ring-2 ring-[#FEAE3A]/80 shadow-md">
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    currentUser?.name?.charAt(0) || 'K'
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FEAE3A] text-[#111827] flex items-center justify-center shadow-xs border border-white">
                  <Camera className="w-3 h-3" />
                </div>
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-sm text-white truncate max-w-[130px]">{currentUser?.name}</p>
                  <span className="text-[9px] bg-[#FEAE3A] text-[#111827] font-black px-1.5 py-0.5 rounded-md uppercase">
                    Gallery
                  </span>
                </div>
                <p className="text-xs text-emerald-200 font-medium truncate max-w-[150px]">{currentUser?.email}</p>
                <span className="text-[10px] font-bold text-[#FEAE3A] uppercase tracking-wider block mt-0.5">
                  {isSuperAdmin ? '👑 Chief Executive' : 'Staff Admin'}
                </span>
              </div>
            </div>

            {/* Quick Session Actions */}
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAdminLogout}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 active:scale-95 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-md border border-red-400/40 transition-all"
                title="Log Out of Administrator Session"
              >
                <LogOut className="w-4 h-4 text-red-100" />
                <span>Log Out</span>
              </button>

              <Link
                to="/browse"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 transition-all"
                title="View Public Marketplace"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#FEAE3A]" />
                <span>Market</span>
              </Link>
            </div>
          </div>
        </div>


        {/* Regular Admin Alert Banner */}
        {!isSuperAdmin && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-[#FEAE3A] mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Staff Admin Permission Restriction</p>
              <p className="text-amber-100/90 mt-0.5 leading-relaxed">
                You have monitor-only access. Actions to add admins, delete vendors/buyers, suspend accounts, and alter platform settings are restricted to Super Administrator <strong className="text-white">keghtorterhemba19@gmail.com</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {/* Total Users */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-[#0F5132]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#111827]">{users.length}</span>
            <p className="text-[11px] text-[#059669] font-medium mt-0.5">Across 23 LGAs</p>
          </div>
        </div>

        {/* Farmers / Vendors */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider">Farmers</span>
            <Store className="w-4 h-4 text-[#0F5132]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#111827]">{vendors.length}</span>
            <p className="text-[11px] text-[#B45309] font-bold mt-0.5">{verifiedVendorsCount} Verified</p>
          </div>
        </div>

        {/* Buyers */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider">Buyers</span>
            <ShoppingBag className="w-4 h-4 text-[#0F5132]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#111827]">{buyers.length}</span>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">Commercial Merchants</p>
          </div>
        </div>

        {/* Active Produce Listings */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider">Listings</span>
            <Package className="w-4 h-4 text-[#0F5132]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#111827]">{products.length}</span>
            <p className="text-[11px] text-[#059669] font-medium mt-0.5">Live Produce Feeds</p>
          </div>
        </div>

        {/* Active Advertisements */}
        <div
          onClick={() => setActiveTab('advertising')}
          className="bg-white p-4 rounded-2xl border border-amber-200 hover:border-amber-400 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:shadow-md bg-gradient-to-r from-amber-50/40 to-white"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B45309]">Active Ads</span>
            <Megaphone className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#B45309]">{activeAdsCount}</span>
            <p className="text-[11px] text-[#B45309] font-bold mt-0.5">{allAds.length} Total Campaigns</p>
          </div>
        </div>

        {/* Complaints & Reports Center */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-white p-4 rounded-2xl border border-red-200 hover:border-red-400 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:shadow-md bg-gradient-to-r from-red-50/30 to-white"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider text-red-900">Complaints</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#111827]">{reports.length}</span>
            <p className="text-[11px] text-red-600 font-bold mt-0.5">
              {reports.filter((r) => r.status === 'pending').length} Pending Review
            </p>
          </div>
        </div>

        {/* Staff Admins */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider">Admins</span>
            <ShieldCheck className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#111827]">{staffAdmins.length}</span>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">1 Super, {staffAdmins.length - 1} Staff</p>
          </div>
        </div>

        {/* Suspended Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-bold uppercase tracking-wider">Suspended</span>
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-red-600">{suspendedCount}</span>
            <p className="text-[11px] text-red-500 font-medium mt-0.5">Policy Flagged</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-2 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'admins'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admins ({staffAdmins.length})</span>
            {isSuperAdmin && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FEAE3A] text-[#111827] rounded-full">
                Control
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'vendors'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Farmers & Vendors ({vendors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buyers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'buyers'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buyers & Merchants ({buyers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'listings'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produce Listings ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'reports'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            <span>Flagged Reports ({reports.length})</span>
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                {reports.filter(r => r.status === 'pending').length} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advertising')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'advertising'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#F59E0B]" />
            <span>Advertising ({allAds.length})</span>
            {activeAdsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FEAE3A] text-[#111827] rounded-full">
                {activeAdsCount} active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'logs'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit Logs ({activityLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'security'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Security & Reopening ({pendingReopenRequests.length})</span>
            {users.filter((u) => u.reopenRequested).length > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-[#111827] rounded-full animate-pulse">
                {users.filter((u) => u.reopenRequested).length} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-[#0F5132] text-white shadow-sm'
                : 'text-[#374151] hover:bg-[#E8F5E9] hover:text-[#0F5132]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Platform Settings</span>
          </button>
        </div>

        {/* Global Action CTA for Tab 1 */}
        {activeTab === 'admins' && isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsAddAdminOpen(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#FEAE3A]" />
            <span>Add New Administrator</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar for Tabular Views */}
      {['admins', 'vendors', 'buyers', 'listings'].includes(activeTab) && (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}... (by name, email, phone, crop)`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={lgaFilter}
              onChange={(e) => setLgaFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
            >
              <option value="all">All 23 Benue LGAs</option>
              {BENUE_LGAS.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab !== 'listings' && (
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ADMINS MANAGEMENT (SUPER ADMIN EXCLUSIVE CONTROL) */}
      {/* ========================================================================= */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
              <span>Platform Administrators</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E8F5E9] text-[#0F5132] rounded-full">
                {filteredAdmins.length} total
              </span>
            </h2>
            <span className="text-xs text-[#6B7280]">
              {isSuperAdmin ? '👑 Super Admin has full governance over all staff accounts' : '🔒 Read-only view for staff admins'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdmins.map((admin) => {
              const isTargetSuper = admin.role === 'super_admin' || admin.isSuperAdmin;
              const isTargetSuspended = admin.status === 'suspended';

              return (
                <div
                  key={admin.id}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative shadow-sm flex flex-col justify-between ${
                    isTargetSuper
                      ? 'border-[#FEAE3A] ring-1 ring-[#FEAE3A]/40 bg-gradient-to-b from-amber-50/20 to-white'
                      : isTargetSuspended
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-[#E8E2D9] hover:border-[#0F5132]/30'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-4">
                    {isTargetSuper ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#FEAE3A] text-[#111827] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#E8F5E9] text-[#0F5132] border border-[#C8E6C9] uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        STAFF ADMIN
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        isTargetSuspended
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isTargetSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => handleOpenGallery(admin)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shadow-sm shrink-0 overflow-hidden cursor-pointer group relative ${
                          isTargetSuper ? 'bg-[#0F5132] text-[#FEAE3A]' : 'bg-[#E8F5E9] text-[#0F5132]'
                        }`}
                        title="Click to view/manage photo gallery"
                      >
                        {admin.profileImage ? (
                          <img
                            src={admin.profileImage}
                            alt={admin.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        ) : (
                          admin.name.charAt(0)
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-extrabold text-sm text-[#111827] truncate">{admin.name}</h3>
                          <button
                            type="button"
                            onClick={() => handleOpenGallery(admin)}
                            className="text-[10px] font-bold text-[#0F5132] bg-[#E8F5E9] hover:bg-[#C8E6C9] px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                            title="Open Photo Gallery"
                          >
                            <Images className="w-3 h-3 text-[#0F5132]" />
                            <span>{admin.gallery?.length || (admin.profileImage ? 1 : 0)} photos</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#6B7280] truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-[#0F5132] shrink-0" />
                          <span className="truncate">{admin.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F3EFEA] space-y-1.5 text-xs text-[#4B5563]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[#6B7280]">
                          <Phone className="w-3 h-3 text-[#0F5132]" />
                          Phone:
                        </span>
                        <span className="font-semibold text-[#111827]">{admin.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[#6B7280]">
                          <MapPin className="w-3 h-3 text-[#0F5132]" />
                          LGA Jurisdiction:
                        </span>
                        <span className="font-semibold text-[#111827]">{admin.lga || 'Makurdi'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Super Admin Control Actions */}
                  <div className="mt-5 pt-3 border-t border-[#E8E2D9] flex items-center justify-between gap-2">
                    {isTargetSuper ? (
                      <div className="w-full text-center py-1.5 text-[11px] font-bold text-[#B45309] bg-amber-50 rounded-xl border border-amber-200">
                        👑 Executive Super Admin (Protected Account)
                      </div>
                    ) : isSuperAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              targetUser: admin,
                              actionType: isTargetSuspended ? 'activate_user' : 'suspend_user',
                            })
                          }
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isTargetSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          {isTargetSuspended ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              isOpen: true,
                              targetUser: admin,
                              actionType: 'delete_admin',
                            })
                          }
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span>Controlled by Super Admin</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VENDORS & FARMERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
              <span>Farmers & Agricultural Cooperatives</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E8F5E9] text-[#0F5132] rounded-full">
                {filteredVendors.length} registered
              </span>
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#6B7280] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Farmer / Cooperative</th>
                    <th className="px-6 py-4">LGA & Market Hub</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Executive Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredVendors.map((vendor) => {
                    const isSuspended = vendor.status === 'suspended';
                    const vendorListingsCount = products.filter((p) => p.sellerId === vendor.id).length;
                    const vendorActiveAdsCount = allAds.filter(
                      (a) => a.vendorId === vendor.id && a.advertisementStatus === 'active'
                    ).length;
                    return (
                      <tr key={vendor.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0F5132] text-white font-bold flex items-center justify-center shrink-0">
                              {vendor.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-[#111827]">{vendor.name}</p>
                              <p className="text-[11px] text-[#6B7280] capitalize">
                                {vendor.userType || 'Producer'} • {vendorListingsCount} active listings{vendorActiveAdsCount > 0 ? ` (${vendorActiveAdsCount} promoted)` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-[#111827]">{vendor.lga} LGA</p>
                          <p className="text-[11px] text-[#6B7280]">{vendor.location || 'Central Depot'}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#111827]">{vendor.phone}</p>
                          <p className="text-[11px] text-[#6B7280]">{vendor.email}</p>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleFarmerVerificationToggle(vendor)}
                            disabled={!isSuperAdmin}
                            title={isSuperAdmin ? 'Toggle verified farmer badge' : 'Super Admin only'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[11px] border transition-all ${
                              vendor.isVerified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                            } ${!isSuperAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${vendor.isVerified ? 'text-[#0F5132]' : 'text-gray-400'}`} />
                            <span>{vendor.isVerified ? 'Verified Farmer' : 'Unverified'}</span>
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isSuperAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      targetUser: vendor,
                                      actionType: isSuspended ? 'activate_user' : 'suspend_user',
                                    })
                                  }
                                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                                    isSuspended
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  }`}
                                  title={isSuspended ? 'Reactivate Vendor' : 'Suspend Vendor'}
                                >
                                  {isSuspended ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      targetUser: vendor,
                                      actionType: 'delete_vendor',
                                    })
                                  }
                                  className="p-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Permanently Delete Vendor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUYERS & MERCHANTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'buyers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
              <span>Registered Buyers & Food Aggregators</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E8F5E9] text-[#0F5132] rounded-full">
                {filteredBuyers.length} buyers
              </span>
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#6B7280] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Buyer / Business Name</th>
                    <th className="px-6 py-4">Location / LGA</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Executive Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {filteredBuyers.map((buyer) => {
                    const isSuspended = buyer.status === 'suspended';
                    return (
                      <tr key={buyer.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FEAE3A]/30 text-[#855400] font-bold flex items-center justify-center shrink-0">
                              {buyer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-[#111827]">{buyer.name}</p>
                              <p className="text-[11px] text-[#6B7280]">
                                {buyer.completedTradesCount || 0} completed procurement orders
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-[#111827]">{buyer.lga || 'Makurdi'} LGA</p>
                          <p className="text-[11px] text-[#6B7280]">{buyer.location || 'Offtake Hub'}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#111827]">{buyer.phone}</p>
                          <p className="text-[11px] text-[#6B7280]">{buyer.email}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              isSuspended
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isSuperAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      targetUser: buyer,
                                      actionType: isSuspended ? 'activate_user' : 'suspend_user',
                                    })
                                  }
                                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                                    isSuspended
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  }`}
                                  title={isSuspended ? 'Reactivate Buyer' : 'Suspend Buyer'}
                                >
                                  {isSuspended ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActionModal({
                                      isOpen: true,
                                      targetUser: buyer,
                                      actionType: 'delete_buyer',
                                    })
                                  }
                                  className="p-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Delete Buyer Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRODUCE LISTINGS MODERATION */}
      {/* ========================================================================= */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
              <span>All Active Agricultural Listings</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E8F5E9] text-[#0F5132] rounded-full">
                {filteredProducts.length} items
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={prod.images[0] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600'}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#111827]/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                    {prod.lga} LGA
                  </div>
                  {prod.isFeatured && (
                    <div className="absolute top-3 right-3 bg-[#FEAE3A] text-[#111827] px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                      <span className="capitalize font-semibold text-[#0F5132]">{prod.category}</span>
                      <span>Min Order: {prod.minimumOrder} {prod.unit}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-[#111827] leading-snug">{prod.name}</h3>
                    <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{prod.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#F3EFEA] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280]">Price:</span>
                      <span className="font-extrabold text-base text-[#0F5132]">
                        {formatNaira(prod.price)} <span className="text-xs font-normal text-[#6B7280]">/ {prod.unit}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6B7280]">
                      <span>Seller:</span>
                      <span className="font-semibold text-[#111827]">{prod.sellerName}</span>
                    </div>
                  </div>

                  {/* Moderation Actions */}
                  <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between gap-2">
                    <Link
                      to={`/product/${prod.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F5132] bg-[#E8F5E9] hover:bg-[#C8E6C9] transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Live</span>
                    </Link>

                    {isSuperAdmin ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleProductFeature(prod.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                            prod.isFeatured
                              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                          title="Toggle Featured Spotlight"
                        >
                          <Star className={`w-3.5 h-3.5 ${prod.isFeatured ? 'fill-current text-amber-500' : ''}`} />
                          <span>{prod.isFeatured ? 'Unfeature' : 'Spotlight'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleProductDelete(prod.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1"
                          title="Delete produce listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Admin Monitor Only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SECURITY AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <AdminAuditLogsTab
          activityLogs={activityLogs}
          isSuperAdmin={isSuperAdmin}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FLAGGED REPORTS & COMPLAINTS MANAGEMENT CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header & Metrics */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] flex items-center gap-2">
                    <span>Seller & Produce Complaints Center</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full">
                      {reports.filter((r) => r.status === 'pending').length} Pending Review
                    </span>
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Investigate buyer & farmer complaints, send official resolution responses, and enforce sanctions.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6B7280] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E8E2D9]">
                  Total Complaints: <strong>{reports.length}</strong>
                </span>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="pt-3 border-t border-[#E8E2D9] flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setReportCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reportCategoryFilter === 'all'
                      ? 'bg-[#0F5132] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#374151] hover:bg-[#E8E2D9]'
                  }`}
                >
                  All ({reports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportCategoryFilter('product')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reportCategoryFilter === 'product'
                      ? 'bg-[#0F5132] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#374151] hover:bg-[#E8E2D9]'
                  }`}
                >
                  📦 Produce Complaints ({reports.filter((r) => r.targetType === 'product').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportCategoryFilter('seller')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reportCategoryFilter === 'seller'
                      ? 'bg-[#0F5132] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#374151] hover:bg-[#E8E2D9]'
                  }`}
                >
                  👨‍🌾 Seller Complaints ({reports.filter((r) => r.targetType === 'seller').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportCategoryFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reportCategoryFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#374151] hover:bg-[#E8E2D9]'
                  }`}
                >
                  ⚠️ Pending ({reports.filter((r) => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportCategoryFilter('resolved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    reportCategoryFilter === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#374151] hover:bg-[#E8E2D9]'
                  }`}
                >
                  ✅ Resolved ({reports.filter((r) => r.status === 'resolved').length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
                />
              </div>
            </div>
          </div>

          {/* Complaints List */}
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((rep) => {
                const isPending = rep.status === 'pending';
                const formatReason = (reason: string) => {
                  switch (reason) {
                    case 'scam_fraud': return 'Scam / Fraud Attempt';
                    case 'fake_product': case 'fake_products': return 'Fake / Counterfeit Produce';
                    case 'wrong_info': return 'Wrong Information';
                    case 'offensive_seller': return 'Offensive / Abusive Behavior';
                    case 'suspicious_seller': return 'Suspicious Profile';
                    case 'duplicate_listing': return 'Duplicate Listing';
                    default: return reason;
                  }
                };

                return (
                  <div
                    key={rep.id}
                    className={`bg-white rounded-3xl p-6 border transition-all shadow-sm ${
                      isPending ? 'border-red-200 bg-gradient-to-r from-red-50/20 to-white' : 'border-[#E8E2D9] opacity-85'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Report Content */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            rep.targetType === 'product'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}>
                            {rep.targetType === 'product' ? '📦 PRODUCE REPORT' : '👨‍🌾 SELLER COMPLAINT'}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span>{formatReason(rep.reason)}</span>
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isPending ? '⚠️ PENDING REVIEW' : '✅ RESOLVED'}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-[#111827]">
                            Target Entity: <span className="text-[#0F5132]">{rep.targetName}</span>
                          </h3>
                          <p className="text-xs text-[#6B7280] font-mono mt-0.5">Reference ID: {rep.targetId}</p>
                        </div>

                        {/* Reported Details Quote */}
                        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#374151]">
                          <p className="font-semibold italic text-[#4B5563]">"{rep.details}"</p>
                        </div>

                        {/* Reporter Metadata */}
                        <div className="flex items-center gap-4 text-xs text-[#6B7280] pt-1">
                          <span>Filed by: <strong className="text-[#111827]">{rep.reporterName || 'Marketplace User'}</strong> ({rep.reporterEmail || 'N/A'})</span>
                          <span>•</span>
                          <span>Filed on: {new Date(rep.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Right: Action Toolbar */}
                      <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#E8E2D9] pt-3 md:pt-0 md:pl-4 min-w-[200px]">
                        {/* Official Response Button */}
                        <button
                          type="button"
                          onClick={() => setReplyModal({ isOpen: true, report: rep })}
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold px-3 py-2 rounded-xl shadow-xs transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#FEAE3A]" />
                          <span>Send Official Response</span>
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            onClick={async () => {
                              await resolveReport(rep.id);
                              showToast('✅ Report marked as resolved');
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#0F5132] text-xs font-bold px-3 py-2 rounded-xl border border-[#C8E6C9] transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-[#0F5132]" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        {rep.targetType === 'product' && isSuperAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteProduct(rep.targetId);
                              await resolveReport(rep.id);
                              showToast('✅ Produce listing deleted & report resolved');
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Delete Reported Produce</span>
                          </button>
                        )}

                        {rep.targetType === 'seller' && isSuperAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              await toggleSuspendUser(rep.targetId, rep.details);
                              await resolveReport(rep.id);
                              showToast('✅ Seller account suspended & report resolved');
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold px-3 py-2 rounded-xl border border-amber-200 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5 text-amber-700" />
                            <span>Suspend Seller Account</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            await deleteReport(rep.id);
                            showToast('🗑️ Complaint entry dismissed');
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                          <span>Dismiss Complaint</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D9] space-y-3">
              <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto" />
              <h3 className="font-extrabold text-lg text-[#111827]">Zero Matching Complaints</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                No seller or produce complaints match the selected filter query. All marketplace listings and profiles are in good standing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ACCOUNT SECURITY & REOPENING REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#111827]">Account Security & Reopening Control Center</h3>
                <p className="text-xs text-[#6B7280]">Review user reopening requests, approve/reject access, and inspect historical audit logs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full border border-amber-300">
                {pendingReopenRequests.length} Action Items
              </span>
            </div>
          </div>

          {/* Pending Reopening Requests */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
              <span>Pending Reopening Requests</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                {pendingReopenRequests.length} pending
              </span>
            </h4>

            {pendingReopenRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReopenRequests.map((usr) => (
                  <div key={usr.id} className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0F5132] text-white font-extrabold text-lg flex items-center justify-center">
                          {usr.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base text-[#111827]">{usr.name}</h4>
                          <p className="text-xs text-[#6B7280] font-mono">{usr.id}</p>
                          <p className="text-xs text-[#4B5563]">{usr.email} • {usr.phone}</p>
                          <span className="inline-block text-[10px] font-bold text-[#0F5132] bg-emerald-50 px-2.5 py-0.5 rounded-md mt-1 uppercase">
                            Account Type: {usr.role === 'seller' ? 'Farmer/Seller 👨‍🌾' : usr.role === 'buyer' ? 'Buyer/User 🛒' : 'Administrator 👑'}
                          </span>
                        </div>
                      </div>

                      {usr.reopenRequested ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-full animate-pulse">
                          Reopen Requested
                        </span>
                      ) : usr.status === 'suspended' ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 rounded-full">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                          5-Min Lockout
                        </span>
                      )}
                    </div>

                    {usr.reopenRequested && (
                      <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                        <p className="font-extrabold text-amber-950">User Submitted Reason:</p>
                        <p className="text-amber-900 italic font-medium">"{usr.reopenRequestReason || 'Requesting account reopening'}"</p>
                        {usr.reopenRequestDate && (
                          <p className="text-[10px] text-amber-700 pt-1 font-mono">
                            Request Date & Time: {new Date(usr.reopenRequestDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {usr.suspendedReason && !usr.reopenRequested && (
                      <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 text-xs text-red-800">
                        <strong>Suspension Reason:</strong> {usr.suspendedReason}
                      </div>
                    )}

                    {isSuperAdmin ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#E8E2D9]">
                        <button
                          type="button"
                          onClick={async () => {
                            await reviewAccountReopen(usr.id, true, 'Approved & Unlocked by Super Admin');
                            showToast(`✅ Account status changed to ACTIVE for ${usr.name}. Login restored.`);
                          }}
                          className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#FEAE3A]" />
                          <span>Approve & Activate Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await reviewAccountReopen(usr.id, false, 'Reopening request rejected by Super Admin');
                            showToast(`❌ Reopening request for ${usr.name} rejected.`);
                          }}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <Ban className="w-4 h-4 text-red-600" />
                          <span>Reject Request</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl font-medium text-center">
                        Super Administrator authorization required to approve or reject reopening requests.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#E8E2D9] space-y-3">
                <ShieldCheck className="w-12 h-12 text-[#10B981] mx-auto" />
                <h3 className="font-extrabold text-lg text-[#111827]">Zero Pending Reopening Requests</h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  All user accounts are in good standing. Zero accounts are currently locked or awaiting Super Admin reopening approval.
                </p>
              </div>
            )}
          </div>

          {/* Request History Section */}
          <div className="space-y-3 pt-4 border-t border-[#E8E2D9]">
            <h4 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
              <span>Account Reopening Request Audit History</span>
            </h4>

            <div className="bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[#6B7280] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Account Holder</th>
                      <th className="px-6 py-4">Account Type</th>
                      <th className="px-6 py-4">Reopening Reason</th>
                      <th className="px-6 py-4">Decision Status</th>
                      <th className="px-6 py-4 text-right">Review Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D9]">
                    {users
                      .flatMap((u) => u.reopeningRequestsHistory || [])
                      .length > 0 ? (
                      users
                        .flatMap((u) => u.reopeningRequestsHistory || [])
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-sm text-[#111827]">{req.userName}</p>
                              <p className="text-[11px] text-[#6B7280]">{req.userEmail}</p>
                              <p className="text-[10px] text-gray-400 font-mono">ID: {req.userId}</p>
                            </td>

                            <td className="px-6 py-4 font-bold text-[#0F5132]">
                              {req.accountType}
                            </td>

                            <td className="px-6 py-4 text-[#4B5563] max-w-xs italic">
                              "{req.reason}"
                              <p className="text-[10px] text-[#9CA3AF] not-italic pt-0.5">
                                Submitted: {new Date(req.requestDate).toLocaleString()}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                  req.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : req.status === 'rejected'
                                    ? 'bg-red-50 text-red-800 border-red-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {req.status === 'approved' ? '✅ Approved & Active' : req.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <p className="font-medium text-[#111827]">{req.adminNote || 'Reviewed by Administrator'}</p>
                              {req.reviewedAt && (
                                <p className="text-[10px] text-[#9CA3AF] font-mono">
                                  {new Date(req.reviewedAt).toLocaleString()}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[#6B7280]">
                          No historical reopening request logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PLATFORM SYSTEM SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#111827]">Benue Market Core Policies & Credentials</h3>
                <p className="text-xs text-[#6B7280]">System-wide configuration controlled by Super Administrator</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8E2D9]">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Super Administrator</span>
                <p className="text-sm font-extrabold text-[#111827]">Keghtor Terhemba</p>
                <p className="text-xs text-[#0F5132] font-mono font-bold">keghtorterhemba19@gmail.com</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Platform Commission</span>
                <p className="text-sm font-extrabold text-[#111827]">₦0.00 (0% Direct Farmgate Trade)</p>
                <p className="text-xs text-[#059669] font-semibold">Zero middleman markup policy</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">LGAs Coverage</span>
                <p className="text-sm font-extrabold text-[#111827]">All 23 Local Government Areas</p>
                <p className="text-xs text-[#6B7280]">Makurdi, Gboko, Otukpo, Ukum (Zaki Biam) & more</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Direct Contact Security</span>
                <p className="text-sm font-extrabold text-[#111827]">WhatsApp & Direct Voice Calling</p>
                <p className="text-xs text-[#6B7280]">Verified farmer badges enforce quality control</p>
              </div>
            </div>
          </div>

          {/* Dedicated Session & Portal Switcher Card */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#B45309] border border-amber-200 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#111827]">Session & Multi-Portal Switcher</h3>
                  <p className="text-xs text-[#6B7280]">Log out or switch to Farmer & Buyer portals to test/conduct trades</p>
                </div>
              </div>

              {/* Top Log Out Button */}
              <button
                type="button"
                onClick={handleAdminLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                <LogOut className="w-4 h-4 text-red-100" />
                <span>Log Out & Exit Session</span>
              </button>
            </div>

            {/* Current Active User Profile Banner */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white font-bold flex items-center justify-center">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-extrabold text-sm text-[#111827]">{currentUser?.name}</p>
                  <p className="text-xs text-[#6B7280]">{currentUser?.email} • {currentUser?.phone}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#FEAE3A] text-[#111827] rounded-full text-xs font-black uppercase tracking-wide shadow-xs">
                {isSuperAdmin ? '👑 Super Admin' : '🛡️ Staff Admin'}
              </span>
            </div>

            {/* Portal Switcher Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Link
                to="/farmer-dashboard"
                className="p-4 rounded-2xl border border-[#E8E2D9] hover:border-[#0F5132] bg-[#FAF8F5] hover:bg-[#E8F5E9]/50 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div className="flex items-center justify-between text-[#0F5132] mb-2">
                  <Store className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111827]">Farmer Portal</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Manage produce harvests & farmer sales</p>
                </div>
              </Link>

              <Link
                to="/buyer-dashboard"
                className="p-4 rounded-2xl border border-[#E8E2D9] hover:border-[#0F5132] bg-[#FAF8F5] hover:bg-[#E8F5E9]/50 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div className="flex items-center justify-between text-[#B45309] mb-2">
                  <ShoppingBag className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111827]">Buyer Portal</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">View saved produce & direct inquiries</p>
                </div>
              </Link>

              <Link
                to="/browse"
                className="p-4 rounded-2xl border border-[#E8E2D9] hover:border-[#0F5132] bg-[#FAF8F5] hover:bg-[#E8F5E9]/50 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div className="flex items-center justify-between text-[#059669] mb-2">
                  <Package className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#111827]">Public Marketplace</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Explore 23 LGAs agricultural listings</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* TAB: ADVERTISING MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'advertising' && (
        <AdminAdvertisingTab
          isSuperAdmin={isSuperAdmin}
          showToast={showToast}
        />
      )}


      {/* Add Admin Modal */}
      <AddAdminModal
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        onAddAdmin={async (data) => {
          await addAdmin(data);
          showToast(`✅ Successfully registered ${data.name} as staff admin`);
        }}
      />

      {/* User Action Confirmation Modal */}
      <UserActionConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, targetUser: null, actionType: 'delete_vendor' })}
        targetUser={actionModal.targetUser}
        actionType={actionModal.actionType}
        onConfirm={handleConfirmUserAction}
      />

      {/* Admin Photo Gallery & Avatar Manager Modal */}
      {galleryModal.targetUser && (
        <AdminGalleryModal
          isOpen={galleryModal.isOpen}
          onClose={() => setGalleryModal({ isOpen: false, targetUser: null })}
          adminUser={galleryModal.targetUser}
          onUpdateGallery={async (userId, gallery, newAvatar) => {
            await updateUserGallery(userId, gallery, newAvatar);
            showToast('✅ Photo gallery & profile picture updated!');
          }}
          isCurrentAdminLoggedIn={Boolean(currentUser && currentUser.id === galleryModal.targetUser.id)}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Admin Executive Response & Reply Modal */}
      <AdminReplyModal
        isOpen={replyModal.isOpen}
        onClose={() => setReplyModal({ isOpen: false, report: null })}
        report={replyModal.report}
        onSendReply={handleSendAdminReply}
      />
    </div>
  );
};
