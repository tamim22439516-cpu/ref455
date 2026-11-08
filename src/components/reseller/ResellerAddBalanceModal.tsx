import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { PaymentSetting } from '../../types/index.js';

interface ResellerAddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: number;
}

export const ResellerAddBalanceModal: React.FC<ResellerAddBalanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount = 120,
}) => {
  const { lang, employee, employeeToken, refreshEmployeeProfile, showToast } = useApp();

  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [amount, setAmount] = useState<number | ''>(initialAmount);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Load Admin configured payment numbers
  useEffect(() => {
    if (isOpen) {
      setSubmittedSuccess(false);
      api.getPaymentSettings()
        .then(settings => {
          if (Array.isArray(settings) && settings.length > 0) {
            setPaymentSettings(settings);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active receiver payment setting
  const activeSetting = paymentSettings.find(
    s => s.name.toLowerCase() === selectedMethod.toLowerCase()
  ) || {
    id: `default-${selectedMethod}`,
    name: selectedMethod,
    isEnabled: true,
    accountType: 'Personal',
    accountNumber: selectedMethod === 'bKash' ? '01700000000' : '01800000000',
    instructionBn: `${selectedMethod === 'bKash' ? 'বিকাশ' : 'নগদ'} অ্যাপ অথবা ডায়াল করে 'Send Money' করুন। রেফারেন্সে আপনার ফোন নম্বর দিন।`,
    instructionEn: `Send Money to this ${selectedMethod} number with your phone number as reference.`,
  };

  const handleCopyNumber = () => {
    if (activeSetting.accountNumber) {
      navigator.clipboard.writeText(activeSetting.accountNumber);
      setCopiedNumber(true);
      showToast(lang === 'bn' ? 'নম্বর কপি করা হয়েছে!' : 'Number copied!', 'success');
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।' : 'File size must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setScreenshotBase64(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToken) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে পুনরায় লগইন করুন।' : 'Please login first.', 'error');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।' : 'Enter valid amount.', 'error');
      return;
    }

    const cleanSender = senderNumber.replace(/[^0-9]/g, '');
    if (cleanSender.length < 11) {
      showToast(lang === 'bn' ? 'যে নম্বর থেকে টাকা পাঠিয়েছেন তার সঠিক ১১ ডিজিট নম্বর লিখুন।' : 'Enter valid 11-digit sender phone.', 'error');
      return;
    }

    if (!trxId.trim() || trxId.trim().length < 4) {
      showToast(lang === 'bn' ? 'সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন।' : 'Enter valid TrxID.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.employeeSubmitBalanceTopup(employeeToken, {
        amount: numAmount,
        paymentMethod: selectedMethod,
        senderNumber: cleanSender,
        trxId: trxId.trim(),
        screenshotUrl: screenshotBase64 || undefined,
      });

      setSubmittedSuccess(true);
      showToast(res.message || (lang === 'bn' ? 'পর্যালোচনা করে আপনার ব্যালেন্স আপনার একাউন্টে যোগ হয়ে যাবে।' : 'Balance top-up submitted!'));
      
      if (refreshEmployeeProfile) {
        refreshEmployeeProfile().catch(() => {});
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      showToast(err.message || 'Balance top-up request failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100100] bg-slate-100 flex flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-in fade-in duration-200">
      
      {/* Clean Light Top Header Navigation (No dark shape bar) */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30 px-3 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 shrink-0"
            title={lang === 'bn' ? 'ফিরে যান' : 'Back'}
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
          </button>
          
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#009245] animate-pulse shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                {lang === 'bn' ? 'ওয়ালেটে ব্যালেন্স যোগ করুন' : 'Add Wallet Balance'}
              </h3>
              <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium truncate">
                {lang === 'bn' ? 'বিকাশ বা নগদ দিয়ে সরাসরি ব্যালেন্স লোড করুন' : 'Top up via bKash or Nagad'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shrink-0"
          title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Main Full-Display Body */}
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 flex-1 pb-28 sm:pb-16">
        
        {submittedSuccess ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center space-y-5 shadow-sm border border-slate-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                {lang === 'bn' ? 'আবেদন সফলভাবে গৃহীত হয়েছে!' : 'Request Submitted!'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {lang === 'bn'
                  ? 'পর্যালোচনা করে আপনার ব্যালেন্স আপনার একাউন্টে যোগ হয়ে যাবে। অনুমোদনের সাথে সাথে নোটিফিকেশন পাবেন।'
                  : 'Your request is under review and balance will be credited to your wallet shortly.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-[#009245] hover:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
            >
              {lang === 'bn' ? 'ঠিক আছে, বন্ধ করুন' : 'Done, Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
            
            {/* Step 1: Select Payment Gateway (bKash / Nagad) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#009245]" />
                {lang === 'bn' ? '১. পেমেন্ট মেথড সিলেক্ট করুন *' : '1. Select Payment Method *'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bKash')}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-black text-sm sm:text-base transition-all cursor-pointer ${
                    selectedMethod === 'bKash'
                      ? 'border-pink-500 bg-pink-50/70 text-pink-700 shadow-xs ring-2 ring-pink-300/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-pink-500 shrink-0" />
                  <span>{lang === 'bn' ? 'বিকাশ (bKash)' : 'bKash'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('Nagad')}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-black text-sm sm:text-base transition-all cursor-pointer ${
                    selectedMethod === 'Nagad'
                      ? 'border-orange-500 bg-orange-50/70 text-orange-700 shadow-xs ring-2 ring-orange-300/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
                  <span>{lang === 'bn' ? 'নগদ (Nagad)' : 'Nagad'}</span>
                </button>
              </div>
            </div>

            {/* Official Receiver Number Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>{lang === 'bn' ? 'কোম্পানির পেমেন্ট নম্বর:' : 'Payment Receiving Number:'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {activeSetting.accountType || 'Personal'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="font-mono text-lg sm:text-xl font-black tracking-wider text-slate-900">
                  {activeSetting.accountNumber || '017XXXXXXXX'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#009245] rounded-xl text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200"
                >
                  {copiedNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNumber ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeSetting.instructionBn || 'উপরের নম্বরে Send Money করে নিচে সঠিক ট্রানজেকশন আইডি (TrxID) দিয়ে সাবমিট করুন।'}
              </p>
            </div>

            {/* Step 2: Amount with Quick Buttons */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-black text-slate-800 block">
                {lang === 'bn' ? '২. টাকার পরিমাণ (৳) *' : '2. Amount (৳) *'}
              </label>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[120, 500, 1000, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                      amount === val
                        ? 'bg-[#009245] text-white border-[#009245] shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>

              {/* Manual Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">৳</span>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="যেমন: ১২০"
                  className="w-full pl-9 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-black font-mono text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Step 3: Sender Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 block">
                {lang === 'bn' ? '৩. যে নম্বর থেকে টাকা পাঠিয়েছেন (১১ ডিজিট) *' : '3. Sender Mobile Number (11 digits) *'}
              </label>
              <input
                type="tel"
                maxLength={11}
                value={senderNumber}
                onChange={e => setSenderNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                placeholder="01XXXXXXXXX"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-mono text-slate-900 tracking-wider"
                required
              />
            </div>

            {/* Step 4: TrxID */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-slate-800 block">
                {lang === 'bn' ? '৪. ট্রানজেকশন আইডি (TrxID) *' : '4. Transaction ID (TrxID) *'}
              </label>
              <input
                type="text"
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder="যেমন: 9J47K2L8"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-mono uppercase text-slate-900 tracking-wider"
                required
              />
            </div>

            {/* Step 5: Screenshot Upload */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center justify-between">
                <span>{lang === 'bn' ? '৫. পেমেন্টের স্ক্রিনশট (প্রমাণ)' : '5. Payment Screenshot'}</span>
                <span className="text-xs text-slate-400 font-normal">{lang === 'bn' ? '(ঐচ্ছিক কিন্তু দ্রুত অনুমোদনে সহায়ক)' : '(Optional)'}</span>
              </label>

              {screenshotPreview ? (
                <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-3">
                  <img
                    src={screenshotPreview}
                    alt="Payment Proof"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs"
                  />
                  <div className="min-w-0 flex-1 text-xs text-slate-600">
                    <p className="font-extrabold text-emerald-700">{lang === 'bn' ? 'স্ক্রিনশট সফলভাবে সংযুক্ত হয়েছে' : 'Screenshot attached'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'bn' ? 'অ্যাডমিন দেখে দ্রুত যাচাই করবেন' : 'Admin will verify'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotBase64('');
                      setScreenshotPreview('');
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs sm:text-sm font-black text-slate-700">
                    {lang === 'bn' ? 'স্ক্রিনশট আপলোড করতে ক্লিক করুন' : 'Click to upload screenshot'}
                  </span>
                  <span className="text-xs text-slate-400">JPG, PNG (সর্বোচ্চ ৫MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Note */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                {lang === 'bn'
                  ? 'সঠিক TrxID ও নম্বর দিয়ে সাবমিট করার পর অ্যাডমিন প্যানেল থেকে দেখে দ্রুত আপনার ওয়ালেটে ব্যালেন্স জমা করে দেওয়া হবে।'
                  : 'After submission, admin will verify details and credit the balance to your live wallet.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base rounded-2xl transition-all cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 py-3.5 bg-gradient-to-r from-emerald-600 to-[#009245] hover:from-emerald-700 hover:to-emerald-800 active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{lang === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === 'bn' ? 'নিশ্চিত করুন' : 'Confirm & Submit'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
