import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Hash,
  Edit3,
  Copy,
  Check,
  Camera,
  X,
  Lock,
  Upload,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { compressImageFile } from '../../utils/imageCompressor.js';

interface ResellerProfileHeaderProps {
  onRefresh: () => Promise<void>;
}

export const ResellerProfileHeader: React.FC<ResellerProfileHeaderProps> = ({ onRefresh }) => {
  const { lang, employee, employeeToken, refreshEmployeeProfile, showToast, setResellerTab, brandSettings } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(employee?.name || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(employee?.avatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!employee) return null;

  const referenceCode =
    employee.referenceCode ||
    `REF-${(employee.phone ? employee.phone.slice(-5) : employee.id.slice(-5)).toUpperCase()}`;

  const formattedJoinDate = employee.registeredAt
    ? new Date(employee.registeredAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : (lang === 'bn' ? '০১ জানুয়ারি ২০২৬' : '01 Jan 2026');

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopiedRef(true);
    showToast(lang === 'bn' ? 'রেফারেন্স আইডি কপি হয়েছে!' : 'Reference ID copied!');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employeeToken) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।' : 'Max image size is 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await compressImageFile(file, 400, 0.8);
      if (!base64) throw new Error('Image compression failed');
      const res = await api.employeeUploadAvatar(employeeToken, base64);
      if (res.success && res.url) {
        setEditAvatarUrl(res.url);
        showToast(lang === 'bn' ? 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!' : 'Avatar uploaded successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Avatar upload failed', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToken) return;

    if (!editName.trim()) {
      showToast(lang === 'bn' ? 'দয়া করে আপনার নাম লিখুন।' : 'Name cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.employeeUpdateProfile(employeeToken, {
        name: editName.trim(),
        avatarUrl: editAvatarUrl,
      });
      await refreshEmployeeProfile();
      await onRefresh();
      showToast(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Premium Profile Header Container */}
      <div className="bg-white border-b border-slate-300 shadow-xs">
        <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5">
            
            {/* Left: Avatar & Reseller Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Profile Picture with Edit Overlay - 100% Round Shape */}
              <div className="relative group shrink-0">
                <div className="w-14 h-14 sm:w-22 sm:h-22 rounded-full p-0.5 sm:p-1 bg-gradient-to-tr from-emerald-500 via-[#009245] to-emerald-400 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white flex items-center justify-center shadow-inner">
                    {employee.avatarUrl ? (
                      <img
                        src={employee.avatarUrl}
                        alt={employee.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-lg sm:text-2xl font-black text-[#009245]">
                        {employee.name ? employee.name.charAt(0).toUpperCase() : 'R'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditName(employee.name);
                    setEditAvatarUrl(employee.avatarUrl || '');
                    setIsEditModalOpen(true);
                  }}
                  className="absolute bottom-0 right-0 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white border border-emerald-300 shadow-xs flex items-center justify-center text-[#009245] hover:bg-emerald-50 transition-all cursor-pointer"
                  title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Avatar'}
                >
                  <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Name, Status, Badges & Meta */}
              <div className="space-y-0.5 sm:space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-xl font-black text-slate-900 tracking-tight truncate max-w-[170px] sm:max-w-none">
                    {employee.name}
                  </h1>

                  {/* Account Status Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#eafff3] text-[#009245] border border-[#c6f6dd]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#009245] animate-pulse" />
                    <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                  </span>
                </div>

                {/* Meta Attributes Grid */}
                <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-0.5 text-[11px] sm:text-xs text-slate-600">
                  {/* Reference ID with Copy */}
                  <div className="inline-flex items-center gap-1 bg-[#f0faf3] px-2 py-0.2 rounded-md border border-emerald-200 font-mono text-[10px] sm:text-[11px] font-bold text-[#009245]">
                    <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#009245]" />
                    <span>ID: {referenceCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="ml-0.5 text-emerald-600 hover:text-emerald-900 transition-colors"
                      title={lang === 'bn' ? 'কপি করুন' : 'Copy'}
                    >
                      {copiedRef ? <Check className="w-2.5 h-2.5 text-emerald-700" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  {/* Mobile Number */}
                  <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                    <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                    <span>{employee.phone}</span>
                  </div>

                  {/* Join Date (Desktop) */}
                  <div className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{lang === 'bn' ? 'যোগদান:' : 'Joined:'} {formattedJoinDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-center">
              <button
                type="button"
                onClick={() => setResellerTab('profile')}
                className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{lang === 'bn' ? 'রেফারেল ও প্রোফাইল' : 'Referral & Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditName(employee.name);
                  setEditAvatarUrl(employee.avatarUrl || '');
                  setIsEditModalOpen(true);
                }}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl inline-flex items-center justify-center gap-1 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              >
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#009245]" />
                <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Profile Modal: Strictly allows Name & Profile Picture change ONLY */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'প্রোফাইল তথ্য পরিবর্তন' : 'Edit Profile'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'শুধুমাত্র নাম ও প্রোফাইল ছবি পরিবর্তন করা যাবে' : 'Only Name and Profile Picture can be modified'}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              
              {/* Profile Picture Upload Section - 100% Round Shape */}
              <div className="flex flex-col items-center gap-3 py-2 bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100">
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

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 text-xs font-bold text-[#009245] bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'নতুন ছবি আপলোড করুন' : 'Upload New Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl('')}
                      className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      {lang === 'bn' ? 'রিমুভ' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              {/* Editable: Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] focus:ring-2 focus:ring-emerald-50 outline-none font-semibold text-slate-900"
                />
              </div>

              {/* Readonly Security Locked Fields */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'স্থায়ী একাউন্ট তথ্য (অপরিবর্তনশীল)' : 'Locked Account Details'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                    </span>
                    <span className="font-mono font-semibold text-slate-700">{employee.phone}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {lang === 'bn' ? 'রেফারেন্স আইডি' : 'Reference ID'}
                    </span>
                    <span className="font-mono font-semibold text-slate-700">{referenceCode}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {lang === 'bn' ? 'ইমেইল' : 'Email'}
                    </span>
                    <span className="font-medium text-slate-700 truncate block">
                      {employee.email || (lang === 'bn' ? 'দেওয়া হয়নি' : 'N/A')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {lang === 'bn' ? 'ঠিকানা (থানা ও জেলা)' : 'Location'}
                    </span>
                    <span className="font-semibold text-slate-700 truncate block text-[11px]">
                      {employee.thana ? `${employee.thana}, ` : ''}{employee.district || (lang === 'bn' ? 'তথ্য নেই' : 'N/A')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {lang === 'bn' ? 'যোগদানের তারিখ' : 'Joined'}
                    </span>
                    <span className="font-semibold text-slate-700 text-[11px]">{formattedJoinDate}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 bg-[#f0faf3] p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                  <span>{lang === 'bn' ? 'নিরাপত্তার স্বার্থে শুধুমাত্র পূর্ণ নাম ও প্রোফাইল ছবি এডিট করা যাবে।' : 'Only name and photo can be modified.'}</span>
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};
