import React, { useState, useMemo } from 'react';
import {
  Activity,
  Shield,
  ShieldAlert,
  Trash2,
  Search,
  Clock,
  Download,
  AlertTriangle,
  X,
  Copy,
  Check,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  Archive,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowUpDown,
  UserCheck,
  Package,
  Flag,
  FileSpreadsheet,
  FileCode,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { AdminActivityLog } from '../../types';

interface AdminAuditLogsTabProps {
  activityLogs: AdminActivityLog[];
  isSuperAdmin: boolean;
  showToast: (msg: string) => void;
}

type CategoryFilter = 'all' | 'security' | 'marketplace' | 'farmers' | 'staff' | 'reports' | 'system';
type TimeframeFilter = 'all' | 'today' | '7days' | '30days' | 'older30';

// Helper for human-readable relative time
const formatRelativeTime = (isoString: string): string => {
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return 'Recently';

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return new Date(isoString).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
};

// Categorize log by keyword matching
const getLogCategory = (log: AdminActivityLog): CategoryFilter => {
  const text = `${log.action} ${log.target} ${log.details || ''}`.toLowerCase();
  if (text.includes('suspend') || text.includes('reactivat') || text.includes('ban') || text.includes('delete account') || text.includes('reopen') || text.includes('security') || text.includes('password')) {
    return 'security';
  }
  if (text.includes('farmer') || text.includes('verif')) {
    return 'farmers';
  }
  if (text.includes('product') || text.includes('produce') || text.includes('listing') || text.includes('feature')) {
    return 'marketplace';
  }
  if (text.includes('admin') || text.includes('staff') || text.includes('role')) {
    return 'staff';
  }
  if (text.includes('report') || text.includes('complaint') || text.includes('resolve') || text.includes('dismiss')) {
    return 'reports';
  }
  return 'system';
};

// Visual badge styling per category
const getCategoryBadge = (category: CategoryFilter) => {
  switch (category) {
    case 'security':
      return {
        icon: ShieldAlert,
        label: 'Security & Access',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
      };
    case 'farmers':
      return {
        icon: UserCheck,
        label: 'Farmer Verification',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'marketplace':
      return {
        icon: Package,
        label: 'Produce Moderation',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'staff':
      return {
        icon: Shield,
        label: 'Admin Governance',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'reports':
      return {
        icon: Flag,
        label: 'Dispute Handling',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'system':
    default:
      return {
        icon: Activity,
        label: 'System & Core',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-500',
      };
  }
};

export const AdminAuditLogsTab: React.FC<AdminAuditLogsTabProps> = ({
  activityLogs,
  isSuperAdmin,
  showToast,
}) => {
  const { deleteActivityLog, deleteActivityLogs, clearActivityLogs } = useAuth();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Multi-selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Copy feedback tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [singleDeleteModal, setSingleDeleteModal] = useState<{
    isOpen: boolean;
    log: AdminActivityLog | null;
  }>({ isOpen: false, log: null });

  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [pruneModalOpen, setPruneModalOpen] = useState(false);
  const [wipeConfirmInput, setWipeConfirmInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Categorize and filter logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return activityLogs
      .filter((log) => {
        // Search query
        if (q) {
          const matchTarget = log.target?.toLowerCase().includes(q);
          const matchAction = log.action?.toLowerCase().includes(q);
          const matchDetails = log.details?.toLowerCase().includes(q);
          const matchAdmin = log.adminName?.toLowerCase().includes(q) || log.adminEmail?.toLowerCase().includes(q);
          if (!matchTarget && !matchAction && !matchDetails && !matchAdmin) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'all') {
          const cat = getLogCategory(log);
          if (cat !== categoryFilter) return false;
        }

        // Timeframe filter
        if (timeframeFilter !== 'all') {
          const logTime = new Date(log.timestamp).getTime();
          const diffMs = now - logTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          const diffDays = diffHours / 24;

          if (timeframeFilter === 'today' && diffHours > 24) return false;
          if (timeframeFilter === '7days' && diffDays > 7) return false;
          if (timeframeFilter === '30days' && diffDays > 30) return false;
          if (timeframeFilter === 'older30' && diffDays <= 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [activityLogs, searchQuery, categoryFilter, timeframeFilter, sortOrder]);

  // Metrics for overview cards
  const metrics = useMemo(() => {
    let securityCount = 0;
    let marketplaceCount = 0;
    let verificationCount = 0;
    let olderThan7Count = 0;
    let olderThan30Count = 0;

    const now = Date.now();
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const ms30d = 30 * 24 * 60 * 60 * 1000;

    activityLogs.forEach((log) => {
      const cat = getLogCategory(log);
      if (cat === 'security') securityCount++;
      if (cat === 'marketplace') marketplaceCount++;
      if (cat === 'farmers') verificationCount++;

      const logTime = new Date(log.timestamp).getTime();
      if (now - logTime > ms7d) olderThan7Count++;
      if (now - logTime > ms30d) olderThan30Count++;
    });

    return {
      total: activityLogs.length,
      security: securityCount,
      marketplace: marketplaceCount,
      verification: verificationCount,
      olderThan7: olderThan7Count,
      olderThan30: olderThan30Count,
    };
  }, [activityLogs]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    if (pageSize === -1) return filteredLogs;
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Selection helpers
  const allCurrentPageSelected = useMemo(() => {
    if (paginatedLogs.length === 0) return false;
    return paginatedLogs.every((log) => selectedIds.has(log.id));
  }, [paginatedLogs, selectedIds]);

  const someCurrentPageSelected = useMemo(() => {
    return paginatedLogs.some((log) => selectedIds.has(log.id)) && !allCurrentPageSelected;
  }, [paginatedLogs, selectedIds, allCurrentPageSelected]);

  const handleToggleSelectAllPage = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedLogs.forEach((l) => next.delete(l.id));
    } else {
      paginatedLogs.forEach((l) => next.add(l.id));
    }
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredLogs.forEach((l) => next.add(l.id));
    setSelectedIds(next);
    showToast(`Selected all ${filteredLogs.length} filtered activity records`);
  };

  const handleInvertSelection = () => {
    const next = new Set(selectedIds);
    paginatedLogs.forEach((l) => {
      if (next.has(l.id)) {
        next.delete(l.id);
      } else {
        next.add(l.id);
      }
    });
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Copy log record to clipboard
  const handleCopyLog = (log: AdminActivityLog) => {
    const text = `[Benue Market Audit] ${log.action} on ${log.target}\nInitiated: ${log.adminName} (${log.adminEmail})\nTime: ${new Date(log.timestamp).toLocaleString()}\nDetails: ${log.details || 'N/A'}\nID: ${log.id}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Single delete handler
  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteModal.log) return;
    try {
      const id = singleDeleteModal.log.id;
      const targetName = singleDeleteModal.log.target;
      await deleteActivityLog(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSingleDeleteModal({ isOpen: false, log: null });
      showToast(`🗑️ Deleted audit log for ${targetName}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? `❌ ${err.message}` : '❌ Failed to delete activity log');
    }
  };

  // Bulk delete handler
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const idsArray = Array.from(selectedIds);
      const count = await deleteActivityLogs(idsArray);
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
      showToast(`🗑️ Successfully deleted ${count} selected activity records`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? `❌ ${err.message}` : '❌ Bulk deletion failed');
    }
  };

  // Prune by age
  const handlePruneDays = async (days: number) => {
    try {
      const count = await clearActivityLogs({ olderThanDays: days });
      setPruneModalOpen(false);
      setSelectedIds(new Set());
      showToast(`🧹 Cleaned up ${count} activity logs older than ${days} days`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? `❌ ${err.message}` : '❌ Pruning failed');
    }
  };

  // Prune currently filtered logs
  const handlePruneFiltered = async () => {
    try {
      const idsToPrune = filteredLogs.map((l) => l.id);
      const count = await deleteActivityLogs(idsToPrune);
      setPruneModalOpen(false);
      setSelectedIds(new Set());
      showToast(`🧹 Deleted ${count} activity logs matching current filter`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? `❌ ${err.message}` : '❌ Pruning failed');
    }
  };

  // Full audit wipe
  const handleConfirmWipeAll = async () => {
    if (!isSuperAdmin) {
      showToast('🔒 Super Administrator authority required for complete ledger wipe');
      return;
    }
    if (wipeConfirmInput.trim().toUpperCase() !== 'RESET') {
      showToast('⚠️ Please type RESET in capital letters to confirm full audit wipe');
      return;
    }
    setIsWiping(true);
    try {
      const count = await clearActivityLogs({ all: true });
      setSelectedIds(new Set());
      setPruneModalOpen(false);
      setWipeConfirmInput('');
      showToast(`⚠️ Full audit history erased: ${count} records purged.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? `❌ ${err.message}` : '❌ Full audit wipe failed');
    } finally {
      setIsWiping(false);
    }
  };

  // Export functions (CSV & JSON)
  const handleExportData = (format: 'json' | 'csv', logsToExport: AdminActivityLog[]) => {
    if (logsToExport.length === 0) {
      showToast('⚠️ No records to export');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let blob: Blob;
    let fileName: string;

    if (format === 'json') {
      const jsonContent = JSON.stringify(logsToExport, null, 2);
      blob = new Blob([jsonContent], { type: 'application/json' });
      fileName = `benue-market-audit-trail-${timestamp}.json`;
    } else {
      // CSV format
      const headers = ['ID', 'Action', 'Target', 'Admin Name', 'Admin Email', 'Timestamp', 'Details'];
      const rows = logsToExport.map((l) => [
        `"${l.id}"`,
        `"${(l.action || '').replace(/"/g, '""')}"`,
        `"${(l.target || '').replace(/"/g, '""')}"`,
        `"${(l.adminName || '').replace(/"/g, '""')}"`,
        `"${(l.adminEmail || '').replace(/"/g, '""')}"`,
        `"${new Date(l.timestamp).toISOString()}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      fileName = `benue-market-audit-trail-${timestamp}.csv`;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
    showToast(`📥 Exported ${logsToExport.length} activity records (${format.toUpperCase()})`);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER & EXECUTIVE ACTION CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-2xl bg-[#0F5132]/10 border border-[#0F5132]/20 flex items-center justify-center text-[#0F5132]">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                Security & Administrative Activity Trail
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#0F5132] border border-[#C8E6C9]">
                <span className="w-2 h-2 rounded-full bg-[#0F5132] animate-pulse" />
                {activityLogs.length} events logged
              </span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed max-w-2xl pl-0 sm:pl-12">
              Tamper-evident chronological audit log recording every executive intervention, user sanction, produce moderation, and security event across Benue State agricultural trade.
            </p>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            {/* Export Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#374151] border border-[#E8E2D9] hover:bg-[#E8E2D9] hover:text-[#111827] transition-all flex items-center gap-1.5 shadow-xs"
                title="Export audit logs"
              >
                <Download className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Export Trail</span>
              </button>

              {exportMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#E8E2D9] shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF] px-3 py-1">
                    Export Formats
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExportData('csv', filteredLogs)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#FAF8F5] rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Spreadsheet (.CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportData('json', filteredLogs)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#FAF8F5] rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <span>Raw Data (.JSON)</span>
                  </button>
                  {selectedIds.size > 0 && (
                    <div className="pt-1.5 mt-1.5 border-t border-[#E8E2D9]">
                      <button
                        type="button"
                        onClick={() => {
                          const selectedList = activityLogs.filter((l) => selectedIds.has(l.id));
                          handleExportData('csv', selectedList);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#0F5132] hover:bg-[#E8F5E9] rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4 text-[#0F5132]" />
                        <span>Export {selectedIds.size} Selected</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart Prune & Purge Button */}
            <button
              type="button"
              onClick={() => {
                setWipeConfirmInput('');
                setPruneModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] hover:bg-[#FFEDD5] hover:text-[#9A3412] transition-all flex items-center gap-1.5 shadow-xs"
              title="Prune or delete excess activity trails"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Prune & Clean Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS & STORAGE HEALTH TILES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
              Total Activity Records
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#111827]">{metrics.total}</span>
              <span className="text-[11px] text-[#0F5132] font-semibold">Active in ledger</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center border border-[#C8E6C9]">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Security Actions */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
              Security & Access
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#111827]">{metrics.security}</span>
              <span className="text-[11px] text-red-600 font-semibold">Sanctions & bans</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Marketplace Moderation */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
              Market Moderation
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#111827]">{metrics.marketplace}</span>
              <span className="text-[11px] text-amber-700 font-semibold">Produce actions</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Storage / Audit Volume */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
              Trail Health
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-extrabold text-[#111827]">
                {activityLogs.length > 35 ? 'High Volume' : 'Optimal'}
              </span>
              <span className="text-[11px] text-[#6B7280]">
                {metrics.olderThan7} older than 7d
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] text-[#374151] flex items-center justify-center border border-[#E8E2D9]">
            <Database className="w-5 h-5 text-[#0F5132]" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH, FILTERS & CONTROLS TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-5 shadow-sm space-y-4">
        {/* Search & Select Controls */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by action, target produce/user, details, or initiating admin..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 focus:border-[#0F5132] placeholder:text-[#9CA3AF] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Timeframe Dropdown */}
            <select
              value={timeframeFilter}
              onChange={(e) => {
                setTimeframeFilter(e.target.value as TimeframeFilter);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 cursor-pointer"
            >
              <option value="all">🕒 All Time</option>
              <option value="today">⚡ Last 24 Hours</option>
              <option value="7days">📅 Last 7 Days</option>
              <option value="30days">🗓️ Last 30 Days</option>
              <option value="older30">⏳ Older than 30 Days</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#374151] hover:bg-[#E8E2D9] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#374151] focus:outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={-1}>All ({filteredLogs.length})</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="pt-2 border-t border-[#E8E2D9] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-[#0F5132] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-[#4B5563] hover:bg-[#E8E2D9]'
            }`}
          >
            All Activity ({activityLogs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('security');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'security'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-[#FAF8F5] text-red-700 hover:bg-red-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Security & Sanctions ({metrics.security})
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('farmers');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'farmers'
                ? 'bg-[#0F5132] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-[#0F5132] hover:bg-[#E8F5E9]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Farmer Verification ({metrics.verification})
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('marketplace');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'marketplace'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#FAF8F5] text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Marketplace Moderation ({metrics.marketplace})
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('staff');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'staff'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#FAF8F5] text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Staff & Governance
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('reports');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'reports'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-[#FAF8F5] text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            Dispute Resolutions
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SELECTION ACTION BANNER (When ≥1 Selected) */}
      {/* ========================================================================= */}
      {selectedIds.size > 0 && (
        <div className="bg-[#111827] text-white rounded-2xl p-4 shadow-xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold flex items-center gap-2">
                <span>{selectedIds.size} activities selected</span>
                <span className="text-[11px] font-semibold text-gray-400">
                  (out of {filteredLogs.length} matching)
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Bulk delete or download records before clearing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            >
              Select All {filteredLogs.length}
            </button>
            <button
              type="button"
              onClick={handleInvertSelection}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            >
              Invert
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
            >
              Clear
            </button>

            {/* Bulk Delete Button */}
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUDIT LOGS LIST & ROWS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] overflow-hidden shadow-sm">
        {/* Table/List Subheader with Master Checkbox */}
        <div className="bg-[#FAF8F5] border-b border-[#E8E2D9] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-xs font-bold text-[#6B7280]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAllPage}
              className="w-5 h-5 rounded-md border border-[#D1D5DB] flex items-center justify-center bg-white hover:border-[#0F5132] transition-colors cursor-pointer"
              title={allCurrentPageSelected ? 'Deselect this page' : 'Select all on this page'}
            >
              {allCurrentPageSelected ? (
                <CheckSquare className="w-4 h-4 text-[#0F5132]" />
              ) : someCurrentPageSelected ? (
                <MinusSquare className="w-4 h-4 text-[#0F5132]" />
              ) : (
                <Square className="w-4 h-4 text-transparent" />
              )}
            </button>
            <span>Activity & Interventions</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden md:inline">Initiated By</span>
            <span>Date & Actions</span>
          </div>
        </div>

        {/* Rows */}
        {paginatedLogs.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center mx-auto text-[#9CA3AF]">
              <Activity className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#111827]">
                {activityLogs.length === 0 ? 'Pristine Audit Trail' : 'No Matching Activity Records'}
              </h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                {activityLogs.length === 0
                  ? 'All administrative activity trails have been cleared. New governance actions will be recorded here automatically.'
                  : 'No activity logs found for your search criteria. Try adjusting or resetting your search and filter parameters.'}
              </p>
            </div>
            {activityLogs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setTimeframeFilter('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0c3e27] transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#E8E2D9]">
            {paginatedLogs.map((log) => {
              const cat = getLogCategory(log);
              const badge = getCategoryBadge(cat);
              const BadgeIcon = badge.icon;
              const isSelected = selectedIds.has(log.id);

              return (
                <div
                  key={log.id}
                  className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors group ${
                    isSelected ? 'bg-[#E8F5E9]/50' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  {/* Select Row Checkbox */}
                  <div className="pt-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleRow(log.id)}
                      className="w-5 h-5 rounded-md border border-[#D1D5DB] flex items-center justify-center bg-white hover:border-[#0F5132] transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#0F5132]" />
                      ) : (
                        <Square className="w-4 h-4 text-transparent group-hover:text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Icon Indicator */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${badge.bg} ${badge.text} flex items-center justify-center shrink-0 border ${badge.border} mt-0.5`}
                  >
                    <BadgeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  {/* Log Content & Metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-[#111827]">
                          {log.action}
                        </span>
                        <span className="text-xs text-[#6B7280]">on</span>
                        <span className="text-xs font-bold text-[#0F5132] bg-[#E8F5E9] px-2.5 py-0.5 rounded-lg border border-[#C8E6C9] max-w-[260px] truncate">
                          {log.target}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Time pill */}
                      <div className="flex items-center gap-2 text-right">
                        <span
                          className="text-[11px] text-[#6B7280] font-semibold flex items-center gap-1 cursor-help"
                          title={new Date(log.timestamp).toLocaleString()}
                        >
                          <Clock className="w-3 h-3 text-[#9CA3AF]" />
                          {formatRelativeTime(log.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Details note */}
                    {log.details && (
                      <p className="text-xs text-[#4B5563] leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D9]/80 font-normal">
                        {log.details}
                      </p>
                    )}

                    {/* Footer Info: Initiated by + ID + Actions */}
                    <div className="flex items-center justify-between gap-3 pt-1 flex-wrap text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#6B7280]">
                        <span>Initiated by:</span>
                        <strong className="text-[#111827]">{log.adminName}</strong>
                        <span className="text-[#9CA3AF]">({log.adminEmail})</span>
                      </div>

                      {/* Per-row Actions */}
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLog(log)}
                          className="px-2 py-1 rounded-lg text-gray-500 hover:text-[#0F5132] hover:bg-[#E8F5E9] flex items-center gap-1 transition-colors"
                          title="Copy activity record to clipboard"
                        >
                          {copiedId === log.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#0F5132]" />
                              <span className="text-[#0F5132] font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Individual Delete Button */}
                        <button
                          type="button"
                          onClick={() => setSingleDeleteModal({ isOpen: true, log })}
                          className="px-2 py-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center gap-1 transition-colors"
                          title="Delete this activity log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline font-semibold">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="bg-[#FAF8F5] border-t border-[#E8E2D9] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#6B7280]">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} events
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E8E2D9] text-[#374151] hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-bold text-[#111827]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E8E2D9] text-[#374151] hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SINGLE DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {singleDeleteModal.isOpen && singleDeleteModal.log && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95 duration-200">
            {/* Top danger decorator stripe */}
            <div className="h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111827]">
                    Delete Activity Trail Record?
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    This single audit entry will be permanently removed from administrative history.
                  </p>
                </div>
              </div>

              {/* Card preview */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#111827]">{singleDeleteModal.log.action}</span>
                  <span className="text-[#0F5132]">{singleDeleteModal.log.target}</span>
                </div>
                {singleDeleteModal.log.details && (
                  <p className="text-[11px] text-[#4B5563] italic">
                    "{singleDeleteModal.log.details}"
                  </p>
                )}
                <div className="text-[10px] text-[#9CA3AF] flex justify-between">
                  <span>By: {singleDeleteModal.log.adminName}</span>
                  <span>{new Date(singleDeleteModal.log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/60 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                  Deleted activity records cannot be recovered. Ensure you have verified this deletion requirement.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSingleDeleteModal({ isOpen: false, log: null })}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4B5563] bg-[#FAF8F5] hover:bg-[#E8E2D9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSingleDelete}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULK DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95 duration-200">
            {/* Top danger decorator stripe */}
            <div className="h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500" />

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 border border-red-300 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#111827]">
                    Permanently Delete {selectedIds.size} Activity Logs?
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    You are about to erase {selectedIds.size} selected audit trail entries from the platform records.
                  </p>
                </div>
              </div>

              {/* Quick option to download backup first */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] flex items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-extrabold text-[#111827]">Save backup before deleting?</p>
                  <p className="text-[11px] text-[#6B7280]">Download CSV archive of selected records</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const selectedList = activityLogs.filter((l) => selectedIds.has(l.id));
                    handleExportData('csv', selectedList);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#E8E2D9] text-[#0F5132] hover:bg-[#E8F5E9] transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800 leading-relaxed font-semibold">
                  This bulk deletion cannot be reversed. The selected {selectedIds.size} log records will be purged immediately.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4B5563] bg-[#FAF8F5] hover:bg-[#E8E2D9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete {selectedIds.size} Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SMART PRUNE & LOG CLEANUP CENTER */}
      {/* ========================================================================= */}
      {pruneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95 duration-200">
            {/* Top decorator stripe */}
            <div className="h-1.5 bg-gradient-to-r from-[#0F5132] via-[#FEAE3A] to-red-600" />

            <div className="p-6 sm:p-7 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#111827]">
                      Audit Trail Pruning & Cleanup Center
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Maintain platform storage health by pruning obsolete or heavy administrative activity trails.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPruneModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-[#FAF8F5] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Safety Backup First Notice */}
              <div className="p-4 bg-[#E8F5E9]/60 rounded-2xl border border-[#C8E6C9] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-[#0F5132] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recommended: Download Ledger Archive First
                  </p>
                  <p className="text-[11px] text-[#4B5563]">
                    Save all {activityLogs.length} current activity events to your local computer before pruning.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportData('csv', activityLogs)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F5132] text-white hover:bg-[#0c3e27] transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Prune Presets Options */}
              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280]">
                  Select Cleanup Operation
                </p>

                {/* Option 1: Older than 7 Days */}
                <div className="p-4 rounded-2xl border border-[#E8E2D9] hover:border-amber-400 bg-white hover:bg-[#FFFDF9] transition-all flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-extrabold text-[#111827]">
                        Prune Logs Older than 7 Days
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {metrics.olderThan7} records
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Cleans previous week activity while keeping recent active logs intact.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePruneDays(7)}
                    disabled={metrics.olderThan7 === 0}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white transition-all shadow-xs shrink-0"
                  >
                    Clean 7d+
                  </button>
                </div>

                {/* Option 2: Older than 30 Days */}
                <div className="p-4 rounded-2xl border border-[#E8E2D9] hover:border-amber-400 bg-white hover:bg-[#FFFDF9] transition-all flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-amber-700" />
                      <h4 className="text-sm font-extrabold text-[#111827]">
                        Prune Historical Logs Older than 30 Days
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {metrics.olderThan30} records
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Archives old historical logs older than one month.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePruneDays(30)}
                    disabled={metrics.olderThan30 === 0}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-700 text-white transition-all shadow-xs shrink-0"
                  >
                    Clean 30d+
                  </button>
                </div>

                {/* Option 3: Delete Current Filtered */}
                {filteredLogs.length > 0 && filteredLogs.length < activityLogs.length && (
                  <div className="p-4 rounded-2xl border border-[#E8E2D9] hover:border-purple-400 bg-white hover:bg-[#FAF8FF] transition-all flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        <h4 className="text-sm font-extrabold text-[#111827]">
                          Delete All Matching Current Filter
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {filteredLogs.length} records
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Deletes only the logs currently matching your search and category filter.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePruneFiltered}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs shrink-0"
                    >
                      Delete Filtered
                    </button>
                  </div>
                )}

                {/* Option 4: Full Audit Wipe with Confirmation Safeguard */}
                <div className="p-4 rounded-2xl border border-red-200 bg-red-50/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h4 className="text-sm font-extrabold text-red-900">
                          Complete Audit Trail Reset
                        </h4>
                      </div>
                      <p className="text-xs text-red-700">
                        Permanently purge all {activityLogs.length} activity records and start with a clean ledger.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-red-200/60 flex flex-col sm:flex-row items-center gap-2.5">
                    <input
                      type="text"
                      value={wipeConfirmInput}
                      onChange={(e) => setWipeConfirmInput(e.target.value)}
                      placeholder='Type "RESET" to confirm'
                      className="w-full sm:flex-1 px-3 py-2 bg-white border border-red-300 rounded-xl text-xs font-mono font-bold text-red-900 placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmWipeAll}
                      disabled={wipeConfirmInput.trim().toUpperCase() !== 'RESET' || isWiping}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isWiping ? 'Resetting...' : 'Purge All Records'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Footer */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPruneModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4B5563] bg-[#FAF8F5] hover:bg-[#E8E2D9] transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
