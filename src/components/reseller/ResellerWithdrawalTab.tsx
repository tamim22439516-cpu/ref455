import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Info,
  ShieldAlert,
  Coins,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Withdrawal } from '../../types/index.js';
import { ResellerAddBalanceModal } from './ResellerAddBalanceModal.js';

interface ResellerWithdrawalTabProps {
  withdrawalsList: Withdrawal[];
  onRefresh: () => Promise<void>;
}

export const ResellerWithdrawalTab: React.FC<ResellerWithdrawalTabProps> = ({
  withdrawalsList,
  onRefresh,
}) => {
  const { lang, employee, employeeToken, refreshEmployeeProfile, showToast, brandSettings } = useApp();

  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [accountType, setAccountType] = useState<'Personal' | 'Merchant' | 'Agent'>('Personal');
  const [transferType, setTransferType] = useState<'CashOut' | 'SendMoney'>('CashOut');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-open Add Balance modal if linked from order checkout low-balance warning
  useEffect(() => {
    const checkAutoOpen = () => {
      if (sessionStorage.getItem('tawzoon_auto_open_add_balance') === 'true') {
        sessionStorage.removeItem('tawzoon_auto_open_add_balance');
        setIsAddBalanceOpen(true);
      }
    };
    checkAutoOpen();
    const handleOpen = () => setIsAddBalanceOpen(true);
    window.addEventListener('tawzoon_open_add_balance', handleOpen);
    return () => window.removeEventListener('tawzoon_open_add_balance', handleOpen);
  }, []);

  if (!employee) return null;

  const totalBalance = employee.wallet.availableBalance;
  const targetReserveLimit = brandSettings?.mandatoryReserveBalance ?? 120;
  // Dynamic Reserve: Only hold funds up to targetReserveLimit (120 Tk) if balance exists
  const mandatoryReserve = Math.min(targetReserveLimit, Math.max(0, totalBalance));
  const sendMoneyFee = brandSettings?.sendMoneyFee ?? 5;

  // Dynamically compute pending & total withdrawn from actual authoritative list
  const computedPending = (withdrawalsList || [])
    .filter(w => (w.status || '').toUpperCase() === 'PENDING')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const pendingWithdrawal = computedPending > 0 ? computedPending : (employee.wallet.pendingWithdrawal || 0);

  const computedWithdrawn = (withdrawalsList || [])
    .filter(w => (w.status || '').toUpperCase() === 'APPROVED' || (w.status || '').toUpperCase() === 'PAID')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const totalWithdrawn = computedWithdrawn > 0 ? computedWithdrawn : (employee.wallet.totalWithdrawn || 0);

  // Withdrawable Balance = Math.max(0, totalBalance - mandatoryReserve)
  const withdrawableBalance = Math.max(0, totalBalance - mandatoryReserve);

  const numAmount = Number(amount) || 0;
  const calculatedFee = React.useMemo(() => {
    if (!numAmount || numAmount <= 0) return 0;
    if (transferType === 'SendMoney') return 5;
    // Cash Out: 20 BDT per 1000 BDT (hazaare 20 taka, dui hazaare 40 taka)
    return Math.round((numAmount / 1000) * 20);
  }, [transferType, numAmount]);

  const netPayout = Math.max(0, numAmount - calculatedFee);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToken) return;

    if (!numAmount || numAmount <= 0) {
      showToast(lang === 'bn' ? 'দয়া করে একটি বৈধ টাকার পরিমাণ লিখুন।' : 'Please enter a valid amount.', 'error');
      return;
    }
    if (numAmount > withdrawableBalance) {
      showToast(
        lang === 'bn'
          ? `আপনার উত্তোলনযোগ্য সর্বোচ্চ ব্যালেন্স ৳${withdrawableBalance.toLocaleString()}। (বাধ্যতামূলক ৳${mandatoryReserve} সংরক্ষিত)`
          : `Maximum withdrawable amount is ৳${withdrawableBalance.toLocaleString()}.`,
        'error'
      );
      return;
    }
    if (!account.trim() || account.trim().length < 11) {
      showToast(lang === 'bn' ? 'দয়া করে ১১ ডিজিটের সঠিক বিকাশ বা নগদ নম্বর দিন।' : 'Please enter valid 11-digit mobile wallet number.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.employeeRequestWithdrawal(employeeToken, {
        amount: numAmount,
        paymentMethod: method,
        accountType,
        accountNumber: account.trim(),
        note: note.trim() || undefined,
      });
      showToast(lang === 'bn' ? 'উইথড্রয়াল আবেদন সফলভাবে জমা হয়েছে!' : 'Withdrawal request submitted!');
      setAmount('');
      setAccount('');
      setNote('');
      // Immediate parallel refresh with zero sequential latency
      Promise.all([refreshEmployeeProfile(), onRefresh()]).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Withdrawal failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section: Balance Overview & Request Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Card: Clean Balance Summary */}
        <div className="bg-gradient-to-br from-emerald-600 via-[#009245] to-emerald-800 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2.5 gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-wider flex items-center gap-1 truncate">
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'bn' ? 'উত্তোলনযোগ্য' : 'Withdrawable'}</span>
                </span>
                <span className="text-[10px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-white inline-flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  <span>{lang === 'bn' ? 'লাইভ ওয়ালেট' : 'Live Wallet'}</span>
                </span>
              </div>

              {/* Blue Shape Animated Top Add Balance Button in Same Row */}
              <button
                type="button"
                onClick={() => setIsAddBalanceOpen(true)}
                className="text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white px-2.5 sm:px-3 py-1.5 rounded-xl shadow-md shadow-blue-950/40 border border-blue-300/40 transition-all duration-300 cursor-pointer flex items-center gap-1 relative overflow-hidden group active:scale-95 animate-pulse hover:animate-none shrink-0"
              >
                <span className="absolute inset-0 w-full h-full bg-white/25 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                <Plus className="w-3.5 h-3.5 stroke-[3] text-white group-hover:rotate-90 transition-transform duration-300" />
                <span>{lang === 'bn' ? 'অ্যাড ব্যালেন্স' : 'Add Balance'}</span>
              </button>
            </div>

            {/* Withdrawable Balance Big Highlight */}
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              ৳{withdrawableBalance.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-100/90 font-medium mt-1">
              {lang === 'bn'
                ? mandatoryReserve < targetReserveLimit
                  ? `সংরক্ষিত ব্যালেন্স: ৳${mandatoryReserve.toLocaleString()} (আয় বাড়লে সর্বোচ্চ ৳${targetReserveLimit} পর্যন্ত রিজার্ভ হবে)`
                  : `বাধ্যতামূলক ৳${mandatoryReserve.toLocaleString()} সংরক্ষিত ব্যালেন্স বাদ দিয়ে উত্তোলনযোগ্য`
                : `Reserved: ৳${mandatoryReserve.toLocaleString()} (Max ৳${targetReserveLimit})`}
            </p>
          </div>

          {/* Reserved & Wallet Breakdown */}
          <div className="pt-3 border-t border-white/20 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-200" />
                {lang === 'bn' ? 'মোট উপলব্ধ ব্যালেন্স:' : 'Total Wallet Balance:'}
              </span>
              <span className="font-extrabold text-white">৳{totalBalance.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-100">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-200" />
                {lang === 'bn' ? 'সংরক্ষিত ব্যালেন্স (রিজার্ভ):' : 'Mandatory Reserve:'}
              </span>
              <span className="font-extrabold text-amber-200">৳{mandatoryReserve.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-100 pt-1 border-t border-white/10">
              <span>{lang === 'bn' ? 'প্রক্রিয়াধীন টাকা:' : 'Pending Payout:'}</span>
              <span className="font-bold text-white">৳{pendingWithdrawal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-100">
              <span>{lang === 'bn' ? 'মোট সফল উত্তোলন:' : 'Total Withdrawn:'}</span>
              <span className="font-bold text-white">৳{totalWithdrawn.toLocaleString()}</span>
            </div>

            {/* Add Balance Full Width Animated Blue Button in Wallet card */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAddBalanceOpen(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-950/50 border border-blue-300/40 hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group active:scale-98"
              >
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
                <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[3] group-hover:rotate-90 transition-transform duration-300 animate-bounce" />
                <span className="tracking-wide">{lang === 'bn' ? 'ওয়ালেটে ইন্সট্যান্ট ব্যালেন্স যোগ করুন' : 'Add Wallet Balance'}</span>
                <Sparkles className="w-4 h-4 text-blue-200 animate-pulse hidden sm:inline-block" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Withdrawal Request Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-[#009245]" />
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'bn' ? 'নতুন টাকা উত্তোলনের আবেদন' : 'Request Payout / Withdrawal'}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {lang === 'bn' ? `সর্বোচ্চ ৳${withdrawableBalance.toLocaleString()} তুলুন` : `Max ৳${withdrawableBalance.toLocaleString()}`}
            </span>
          </div>

          <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'উত্তোলনের পরিমাণ (৳)' : 'Amount (৳)'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={withdrawableBalance}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={lang === 'bn' ? `যেমন: 50, 100, ${withdrawableBalance || 260}` : `e.g. ${withdrawableBalance || 100}`}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'} <span className="text-[#009245]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('bKash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      method === 'bKash'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    বিকাশ (bKash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('Nagad')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      method === 'Nagad'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    নগদ (Nagad)
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Type: Cash Out vs Send Money */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'bn' ? 'ট্রানজেকশন টাইপ' : 'Transaction Type'} <span className="text-[#009245]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferType('CashOut')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    transferType === 'CashOut'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'bn' ? 'ক্যাশআউট (হাজারে ২০৳)' : 'Cash Out (20৳/1000৳)'}
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('SendMoney')}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    transferType === 'SendMoney'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'bn' ? 'সেন্ড মানি (৫৳)' : 'Send Money (5৳)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'অ্যাকাউন্ট টাইপ' : 'Account Type'} <span className="text-[#009245]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAccountType('Personal')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      accountType === 'Personal'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'bn' ? 'পার্সোনাল' : 'Personal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('Merchant')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      accountType === 'Merchant'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'bn' ? 'মার্চেন্ট' : 'Merchant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('Agent')}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      accountType === 'Agent'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'bn' ? 'এজেন্ট' : 'Agent'}
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? `${method} নম্বর (১১ ডিজিট)` : `${method} Account Number`} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Note / Remarks */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'bn' ? 'অতিরিক্ত নোট (ঐচ্ছিক)' : 'Note (Optional)'}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: বিশেষ নির্দেশনা থাকলে লিখুন' : 'Personal remarks or note'}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none text-slate-700"
              />
            </div>

            {/* Dynamic Live Fee & Payout Breakdown */}
            {numAmount > 0 && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-1.5 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{lang === 'bn' ? 'উত্তোলনের মোট আবেদন:' : 'Requested Amount:'}</span>
                  <span className="font-bold text-slate-900">৳{numAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-rose-600">
                  <span>
                    {lang === 'bn'
                      ? (transferType === 'CashOut' ? 'ক্যাশআউট চার্জ (হাজারে ২০৳):' : 'সেন্ড মানি ফি (৫৳):')
                      : (transferType === 'CashOut' ? 'Cash Out Charge (20৳/1000):' : 'Send Money Fee (5৳):')}
                  </span>
                  <span className="font-bold">-৳{calculatedFee}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 font-black text-[#009245] text-sm">
                  <span>{lang === 'bn' ? 'আপনি পাবেন (নিট পেমেন্ট):' : 'Net Payout:'}</span>
                  <span>৳{netPayout.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || withdrawableBalance <= 0 || !numAmount || numAmount > withdrawableBalance}
              className="w-full py-2.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? (lang === 'bn' ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting...')
                : (lang === 'bn' ? 'উইথড্রয়াল আবেদন সাবমিট করুন' : 'Submit Withdrawal Request')}
            </button>

          </form>
        </div>

      </div>

      {/* Notice & Rule Text Box */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
          <Info className="w-4 h-4 text-[#009245] shrink-0" />
          <span>{lang === 'bn' ? '📌 টাকা উত্তোলন ও সংরক্ষিত ব্যালেন্স সংক্রান্ত নিয়মাবলী:' : '📌 Withdrawal & Reserved Balance Rules:'}</span>
        </div>
        <ul className="space-y-1.5 pl-5 list-disc text-slate-600 text-[11px] leading-relaxed">
          <li>
            <strong>বাধ্যতামূলক ৳{mandatoryReserve} সংরক্ষিত ব্যালেন্স:</strong> প্রতিটি রিসেলার অ্যাকাউন্টে ৳{mandatoryReserve} টাকা স্থায়ীভাবে সংরক্ষিত থাকবে। সাধারণ উত্তোলনের মাধ্যমে এই ৳{mandatoryReserve} তোলা যাবে না।
          </li>
          <li>
            <strong>নমনীয় উত্তোলন সুবিধা:</strong> ৳{mandatoryReserve} টাকা বাদ দিয়ে ওয়ালেটে অবশিষ্ট যেকোনো পরিমাণ টাকা (যেমন ৳৫০, ৳৭৫, ৳১০০, ৳২৬০) যখন খুশি ফ্লেক্সিবলভাবে তুলতে পারবেন।
          </li>
          <li>
            <strong>ক্যাশআউট ও সেন্ড মানি চার্জ:</strong> ক্যাশআউট (পার্সোনাল, মার্চেন্ট বা এজেন্ট) ক্ষেত্রে হাজারে ২০ টাকা এবং সেন্ড মানির ক্ষেত্রে ৫ টাকা চার্জ কর্তন করা হবে।
          </li>
          <li>
            <strong>অ্যাকাউন্ট ক্লোজ/সেটেলমেন্ট:</strong> ভবিষ্যতে অ্যাকাউন্ট স্থায়ীভাবে বন্ধ করার প্রয়োজন হলে সংরক্ষিত এই ৳{mandatoryReserve} টাকাসহ সম্পূর্ণ ফাইনাল হিসাব পেমেন্ট করে দেওয়া হবে।
          </li>
        </ul>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            {lang === 'bn' ? 'উইথড্রয়াল হিস্ট্রি ও পেমেন্ট রেকর্ড' : 'Withdrawal Request Records'}
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {withdrawalsList.length} {lang === 'bn' ? 'টি আবেদন' : 'requests'}
          </span>
        </div>

        {withdrawalsList.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'bn' ? 'পূর্বে কোনো উইথড্রয়াল রেকর্ড নেই।' : 'No withdrawal records found.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Mobile View: Clean, professional 2-line cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {withdrawalsList.map((wd, index) => {
                const isApproved = wd.status === 'APPROVED';
                const isRejected = wd.status === 'REJECTED';
                const fee = wd.feeAmount ?? sendMoneyFee;
                const net = wd.netPayout ?? Math.max(0, wd.amount - fee);
                const dateStr = new Date(wd.requestDate).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div key={wd.id} className="py-3 px-1 space-y-2 hover:bg-slate-50/70 transition-colors">
                    {/* Line 1: Serial/Method + Account Type + Number on Left, Status on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          #{index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                            wd.paymentMethod === 'bKash'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {wd.paymentMethod}
                        </span>
                        {wd.accountType && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {wd.accountType === 'Personal' ? (lang === 'bn' ? 'পার্সোনাল' : 'Personal') : wd.accountType === 'Merchant' ? (lang === 'bn' ? 'মার্চেন্ট' : 'Merchant') : wd.accountType}
                          </span>
                        )}
                        <span className="font-mono font-bold text-xs text-slate-800 tracking-tight">
                          {wd.accountNumber}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isApproved ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{isApproved ? (lang === 'bn' ? 'অনুমোদিত' : 'APPROVED') : isRejected ? (lang === 'bn' ? 'বাতিল' : 'REJECTED') : (lang === 'bn' ? 'পেন্ডিং' : 'PENDING')}</span>
                      </span>
                    </div>

                    {/* Line 2: Date on Left, Request Amount & Net Payout on Right */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="text-[11px] font-medium flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dateStr}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[11px]">
                          {lang === 'bn' ? 'আবেদন:' : 'Req:'} <strong className="text-slate-800 font-bold font-mono">৳{wd.amount.toLocaleString()}</strong>
                        </span>
                        <span className="font-bold text-emerald-700 font-mono text-xs">
                          {lang === 'bn' ? 'নিট:' : 'Net:'} ৳{net.toLocaleString()}
                          <span className="text-[10px] text-slate-400 font-normal"> (ফি: ৳{fee})</span>
                        </span>
                      </div>
                    </div>

                    {/* Admin Note if Rejected or Processed */}
                    {wd.adminNote && (
                      <div className="text-[10.5px] bg-slate-50 rounded-lg p-1.5 border border-slate-200/80 text-slate-600">
                        <span className="block text-rose-600 font-medium">
                          {lang === 'bn' ? 'অ্যাডমিন নোট:' : 'Admin Note:'} {wd.adminNote}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Spacious Table with Minimum Width */}
            <div className="hidden sm:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px]">
                    <th className="pb-3">{lang === 'bn' ? 'মেথড' : 'Method'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'আবেদনকৃত' : 'Requested'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'ফি ও নিট পেমেন্ট' : 'Fee & Net'}</th>
                    <th className="pb-3 text-right">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {withdrawalsList.map((wd) => {
                    const isApproved = wd.status === 'APPROVED';
                    const isRejected = wd.status === 'REJECTED';
                    const fee = wd.feeAmount ?? sendMoneyFee;
                    const net = wd.netPayout ?? Math.max(0, wd.amount - fee);

                    return (
                      <tr key={wd.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-bold text-slate-900">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                              wd.paymentMethod === 'bKash'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {wd.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900">{wd.accountNumber}</span>
                            {wd.accountType && (
                              <span className="ml-1 text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                                {wd.accountType === 'Personal' ? (lang === 'bn' ? 'পার্সোনাল' : 'Personal') : wd.accountType === 'Merchant' ? (lang === 'bn' ? 'মার্চেন্ট' : 'Merchant') : wd.accountType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(wd.requestDate).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 font-extrabold text-slate-900">
                          ৳{wd.amount.toLocaleString()}
                        </td>
                        <td className="py-3 font-bold text-emerald-700">
                          ৳{net.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">(ফি: ৳{fee})</span>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isApproved ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{isApproved ? (lang === 'bn' ? 'অনুমোদিত' : 'APPROVED') : isRejected ? (lang === 'bn' ? 'বাতিল' : 'REJECTED') : (lang === 'bn' ? 'পেন্ডিং' : 'PENDING')}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Balance Modal */}
      <ResellerAddBalanceModal
        isOpen={isAddBalanceOpen}
        onClose={() => setIsAddBalanceOpen(false)}
        onSuccess={() => {
          setIsAddBalanceOpen(false);
          if (refreshEmployeeProfile) refreshEmployeeProfile().catch(() => {});
          if (onRefresh) onRefresh().catch(() => {});
        }}
      />
    </div>
  );
};

