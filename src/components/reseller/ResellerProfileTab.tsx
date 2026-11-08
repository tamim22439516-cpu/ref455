import React, { useState, useEffect } from 'react';
import {
  User,
  Camera,
  Lock,
  Edit2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
  MessageCircle,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { compressImageFile } from '../../utils/imageCompressor.js';

interface ReferralMember {
  id: string;
  name: string;
  phone: string;
  district?: string;
  thana?: string;
  status: string;
  registeredAt: string;
  avatarUrl?: string;
  orderCount?: number;
  referralCommission?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalSales?: number;
  paidCommission?: number;
  pendingCommission?: number;
}

interface ReferralData {
  referenceCode: string;
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  bonusEarned: number;
  referrals: ReferralMember[];
}

interface ResellerProfileTabProps {
  onOpenWithdrawal: () => void;
  onRefresh: () => void;
}

export const ResellerProfileTab: React.FC<ResellerProfileTabProps> = ({
  onOpenWithdrawal,
  onRefresh,
}) => {
  const { lang, employee, employeeToken, setEmployeeSession, showToast, brandSettings, employeeLogout } = useApp();

  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadReferrals = async () => {
    if (!employeeToken) return;
    setLoadingReferrals(true);
    try {
      const res = await api.employeeGetReferrals(employeeToken);
      setReferralData(res);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [employeeToken]);

  // Edit Name & Avatar Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(employee?.name || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(employee?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password Change
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!employee) return null;

  const refCode = referralData?.referenceCode || employee.referenceCode || `REF-${(employee.phone ? employee.phone.slice(-5) : employee.id.slice(-5)).toUpperCase()}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tawzoonnexus.com';
  const referralLink = `${origin}/?portal=reseller&ref=${encodeURIComponent(refCode)}`;
  const whatsappMessage = `আসসালামু আলাইকুম! তাওজুন (Tawzoon) প্ল্যাটফর্মে রিসেলার হিসেবে যুক্ত হয়ে ঘরে বসে চমৎকার কমিশন আয় করুন। কোনো প্রকার ইনভেস্টমেন্ট ছাড়াই শুরু করুন আপনার অনলাইন রিসেলিং ব্যবসা।\n\n📌 আমার রেফারেন্স কোড: ${refCode}\n🔗 সরাসরি রেজিস্ট্রেশন লিংক: ${referralLink}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    showToast(lang === 'bn' ? 'রেফারেল কোড কপি হয়েছে!' : 'Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast(lang === 'bn' ? 'রেফারেল লিংক কপি হয়েছে!' : 'Referral link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employeeToken) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'bn' ? 'ছবির সাইজ ৫MB এর কম হতে হবে।' : 'Image size must be under 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await compressImageFile(file, 400, 0.8);
      if (!base64) throw new Error('Image compression failed');
      const res = await api.employeeUploadAvatar(employeeToken, base64);
      setEditAvatarUrl(res.url);
      showToast(lang === 'bn' ? 'ছবি সফলভাবে প্রসেস ও আপলোড হয়েছে!' : 'Avatar uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToken || !editName.trim()) return;

    setIsSaving(true);
    try {
      const res = await api.employeeUpdateProfile(employeeToken, {
        name: editName.trim(),
        avatarUrl: editAvatarUrl || undefined,
      });
      setEmployeeSession(employeeToken, res.employee, true);
      setIsEditModalOpen(false);
      onRefresh();
      showToast(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'bn' ? 'নতুন পাসওয়ার্ড দুটি মেলেনি।' : 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (!employeeToken) return;

    setPasswordLoading(true);
    try {
      await api.employeeChangePassword(employeeToken, {
        oldPassword,
        newPassword,
      });
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password changed successfully!');
    } catch (err: any) {
      setPasswordError(err.message || 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PROFILE HERO CARD (Compact, Sleek & Professional)       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Avatar & Reseller Info */}
          <div className="flex items-center gap-3 text-left w-full sm:w-auto flex-1 min-w-0">
            
            {/* 100% Round Avatar with Edit Camera Button */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-[#009245] to-emerald-400 shadow-xs flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white flex items-center justify-center shadow-inner">
                  {employee.avatarUrl ? (
                    <img
                      src={employee.avatarUrl}
                      alt={employee.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg sm:text-xl font-black text-[#009245]">
                      {employee.name ? employee.name.charAt(0).toUpperCase() : 'R'}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Camera Button */}
              <button
                type="button"
                onClick={() => {
                  setEditName(employee.name);
                  setEditAvatarUrl(employee.avatarUrl || '');
                  setIsEditModalOpen(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 w-5.5 h-5.5 rounded-full bg-white border border-emerald-300 shadow-xs flex items-center justify-center text-[#009245] hover:bg-emerald-50 transition-all cursor-pointer"
                title={lang === 'bn' ? 'ছবি ও প্রোফাইল পরিবর্তন' : 'Edit Profile'}
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Profile Information: Name, Active date, Phone, Email, Location */}
            <div className="space-y-1 min-w-0 flex-1">
              
              {/* Row 1: Name + Active Badge + Active Since Date */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                  {employee.name}
                </h1>
                
                {/* Active Status Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#eafff3] text-[#009245] border border-[#c6f6dd]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009245] animate-pulse" />
                  <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                </span>

                {/* Account Active Date */}
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  🗓️ {lang === 'bn' ? 'একটিভ:' : 'Active:'}{' '}
                  {new Date(employee.registeredAt).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Row 2: Mobile Number + Email */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1 text-[11px] sm:text-xs">
                  <Phone className="w-3 h-3 text-[#009245]" />
                  <span>{employee.phone}</span>
                </span>

                {employee.email && (
                  <>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-slate-600 font-medium flex items-center gap-1 truncate max-w-[190px] sm:max-w-[260px] text-[11px] sm:text-xs" title={employee.email}>
                      <Mail className="w-3 h-3 text-[#009245] shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Row 3: Location (District, Thana) */}
              {(employee.district || employee.thana) && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-slate-600 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                    <MapPin className="w-3 h-3 text-[#009245]" />
                    <span>{employee.thana ? `${employee.thana}, ` : ''}{employee.district}</span>
                  </span>
                </div>
              )}

            </div>

          </div>

          {/* Action Buttons: Edit Profile & Change Password */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditName(employee.name);
                setEditAvatarUrl(employee.avatarUrl || '');
                setIsEditModalOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold text-[#009245] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shadow-3xs"
            >
              <Edit2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>{lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: EDIT NAME & AVATAR (100% Round Shape & Security)    */}
      {/* ------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl border border-emerald-100 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {lang === 'bn' ? 'প্রোফাইল তথ্য পরিবর্তন' : 'Edit Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* 100% Round Avatar Upload */}
              <div className="flex flex-col items-center gap-3 py-2 bg-[#f0faf3] rounded-2xl p-4 border border-[#d8f0e0]">
                <div className="w-22 h-22 rounded-full bg-white border-3 border-[#009245] overflow-hidden shadow-sm flex items-center justify-center relative">
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-10 h-10 text-emerald-400" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/85 flex items-center justify-center text-xs font-bold text-[#009245] rounded-full">
                      {lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </div>
                  )}
                </div>

                <label className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? (lang === 'bn' ? 'অপেক্ষা করুন...' : 'Processing...') : (lang === 'bn' ? 'নতুন ছবি বাছুন' : 'Upload Photo')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-[10px] text-slate-500">JPG, PNG বা WEBP (সর্বোচ্চ ৫ MB)</p>
              </div>

              {/* Editable Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-[#009245]">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#009245] bg-[#eafff3] px-2 py-0.2 rounded border border-[#c6f6dd]">
                    {lang === 'bn' ? 'পরিবর্তনযোগ্য' : 'Editable'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                />
              </div>

              {/* Locked Registration Fields */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Lock className="w-3 h-3 text-[#009245]" />
                    <span>{lang === 'bn' ? 'স্থায়ী তথ্য (অপরিবর্তনযোগ্য)' : 'Locked Account Details'}</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    🔒 {lang === 'bn' ? 'লক করা' : 'Locked'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Phone */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                    </span>
                    <span className="font-mono font-bold text-slate-700 text-[11px] truncate block">
                      {employee.phone}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'ইমেইল' : 'Email'}
                    </span>
                    <span className="font-medium text-slate-700 text-[11px] truncate block" title={employee.email}>
                      {employee.email || (lang === 'bn' ? 'প্রদান করা হয়নি' : 'N/A')}
                    </span>
                  </div>

                  {/* District & Thana */}
                  <div className="col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'bn' ? 'ঠিকানা' : 'Location'}
                    </span>
                    <span className="font-medium text-slate-700 text-[11px] truncate block">
                      {employee.thana ? `${employee.thana}, ` : ''}{employee.district || (lang === 'bn' ? 'তথ্য নেই' : 'N/A')}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 bg-[#f0faf3] p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                  <span>{lang === 'bn' ? 'নিরাপত্তার কারণে শুধুমাত্র নাম ও প্রোফাইল ছবি এডিট করা যাবে।' : 'Only name and photo can be modified.'}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: CHANGE PASSWORD                                      */}
      {/* ------------------------------------------------------------- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-3xl border border-emerald-100 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#009245]" />
                <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (min 6 chars)'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? (lang === 'bn' ? 'পরিবর্তন হচ্ছে...' : 'Updating...') : (lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}



      {/* ------------------------------------------------------------- */}
      {/* 5. REFERRAL & NETWORK SECTION (রিসেলার প্রোফাইল সেকশন)            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-emerald-100/90 p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-wrap">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#009245]" />
              <span>{lang === 'bn' ? 'রেফারেল ও নেটওয়ার্ক' : 'Referral & Network'}</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'আপনার রেফারেল কোড বা লিংক শেয়ার করে নতুন রিসেলার যুক্ত করুন'
                : 'Invite new resellers with your referral code or link'}
            </p>
          </div>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>{lang === 'bn' ? 'WhatsApp' : 'WhatsApp'}</span>
          </a>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Total Referrals */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              {lang === 'bn' ? 'মোট রেফারেল' : 'Total Referred'}
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {referralData?.totalCount || 0} {lang === 'bn' ? 'জন' : ''}
            </div>
          </div>

          {/* Card 2: Active Resellers */}
          <div className="bg-[#f0faf3] rounded-xl p-3 border border-[#d8f0e0] shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">
              {lang === 'bn' ? 'সক্রিয় সদস্য' : 'Active Members'}
            </span>
            <div className="text-lg sm:text-xl font-black text-[#009245] font-mono">
              {referralData?.approvedCount || 0} {lang === 'bn' ? 'জন' : ''}
            </div>
          </div>

          {/* Card 3: Pending Approvals */}
          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80 shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block">
              {lang === 'bn' ? 'পেন্ডিং আবেদন' : 'Pending'}
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-700 font-mono">
              {referralData?.pendingCount || 0} {lang === 'bn' ? 'জন' : ''}
            </div>
          </div>

          {/* Card 4: Total Referral Bonus */}
          <div className="bg-[#eafff3] rounded-xl p-3 border border-[#c6f6dd] shadow-2xs space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wide block">
              {lang === 'bn' ? 'বোনাস আয়' : 'Bonus Earned'}
            </span>
            <div className="text-lg sm:text-xl font-black text-[#009245] font-mono">
              ৳{(referralData?.bonusEarned || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Share Section: Code & Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Box 1: Reference Code */}
          <div className="bg-[#fdf2f8] rounded-xl p-3 border border-pink-100 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              {lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-pink-200 text-sm font-mono font-black text-pink-600 tracking-wider text-center select-all shadow-inner">
                {refCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 ${
                  copiedCode ? 'bg-emerald-500 text-white' : 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-50'
                }`}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Box 2: Invitation Link */}
          <div className="bg-[#f0faf3] rounded-xl p-3 border border-emerald-100 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              {lang === 'bn' ? 'অনলাইন ইনভাইটেশন লিংক' : 'Invitation Link'}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-mono text-slate-700 truncate select-all shadow-inner">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0 ${
                  copiedLink ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-1.5 py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে ইনভাইটেশন লিংক শেয়ার' : 'Share on WhatsApp'}</span>
            </a>
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. LOGOUT OPTION                                               */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2 pb-6">
        <button
          type="button"
          onClick={employeeLogout}
          className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>{lang === 'bn' ? 'লগআউট করুন (Logout Account)' : 'Logout Account'}</span>
        </button>
      </div>

    </div>
  );
};
