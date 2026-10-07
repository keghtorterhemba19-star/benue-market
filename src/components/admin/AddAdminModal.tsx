import React, { useState } from 'react';
import { X, ShieldPlus, User, Mail, Phone, MapPin, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { BENUE_LGAS } from '../../constants/benue';
import type { BenueLGA } from '../../types';
import type { AddAdminPayload } from '../../context/AuthContext';

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAdmin: (data: AddAdminPayload) => Promise<any>;
}

export const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, onAddAdmin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lga, setLga] = useState<BenueLGA>('Makurdi');
  const [password, setPassword] = useState('StaffAdmin2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        throw new Error('Please fill in all required fields.');
      }

      await onAddAdmin({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        lga,
        password: password.trim() || 'StaffAdmin2026!',
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setEmail('');
        setPhone('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] overflow-hidden">
        {/* Top Gold-Green Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-[#0F5132] via-[#FEAE3A] to-[#25D366]" />

        {/* Header */}
        <div className="p-6 md:p-7 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center border border-[#C8E6C9] shadow-sm">
              <ShieldPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-[#111827]">Add Staff Administrator</h3>
              <p className="text-xs text-[#4B5563]">Grant monitoring & audit access under Super Admin oversight</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-semibold animate-in shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-in zoom-in-95">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Staff administrator created successfully!</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>Administrator Full Name</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Doofan Iorfa (Market Supervisor)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>Official Admin Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="doofan.admin@benuemarket.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Phone / WhatsApp</span>
              </label>
              <input
                type="tel"
                required
                placeholder="08031234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
              />
            </div>

            {/* LGA Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Operational LGA</span>
              </label>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value as BenueLGA)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
              >
                {BENUE_LGAS.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name} ({l.majorMarket})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Initial Access Password</span>
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm font-mono text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
            <p className="text-[11px] text-[#6B7280]">
              The new staff admin will use this password to sign in.
            </p>
          </div>

          {/* Permissions Notice Box */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Restricted Staff Policy
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Staff Administrators are granted monitor-only access (viewing produce directory, market statistics, and logs). They cannot add other admins, delete users, or modify platform settings.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-[#374151] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Creating Admin...</span>
              ) : (
                <>
                  <ShieldPlus className="w-4 h-4" />
                  <span>Authorize Administrator</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
