import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Share2,
  Search,
  Filter,
  Eye,
  X,
  LogOut,
  TrendingUp,
  PackageCheck,
  Ban,
  DollarSign,
  Phone,
  MapPin,
  ShoppingBag,
  Sparkles,
  Calculator,
  Info,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

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

export const ResellerReferralTab: React.FC = () => {
  const { lang, employee, employeeToken, showToast, employeeLogout } = useApp();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadReferrals = async () => {
    if (!employeeToken) return;
    setLoading(true);
    try {
      const res = await api.employeeGetReferrals(employeeToken);
      setReferralData(res);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [employeeToken]);

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

  const filteredReferrals = referralData?.referrals.filter(ref => 
    ref.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ref.phone.includes(searchTerm)
  ) || [];

  return (
    <div className="space-y-3 sm:space-y-5 pb-10">
      
      {/* Header Section (Compact & Sleek) */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
              {lang === 'bn' ? 'রেফারেল ও নেটওয়ার্ক' : 'Referral & Network'}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
              {lang === 'bn' ? 'যুক্ত হওয়া রিসেলার ও আয়ের বিস্তারিত' : 'Network details & earnings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
           <button 
             onClick={loadReferrals}
             className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors border border-slate-200 cursor-pointer"
             title={lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
           >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           </button>
           <a
             href={whatsappShareUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
           >
             <MessageCircle className="w-3.5 h-3.5 fill-current" />
             <span>WhatsApp</span>
           </a>
        </div>
      </div>

      {/* Main Stats Grid (Compact & Perfectly Adjusted for Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: Total Referrals */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {lang === 'bn' ? 'মোট রেফারেল' : 'Total Referred'}
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {referralData?.totalCount || 0} {lang === 'bn' ? 'জন' : ''}
          </div>
        </div>

        {/* Card 2: Active Resellers */}
        <div className="bg-[#f0faf3] border border-[#d8f0e0] rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            {lang === 'bn' ? 'সক্রিয় সদস্য' : 'Active Resellers'}
          </span>
          <div className="text-base sm:text-lg font-black text-[#009245] font-mono">
            {referralData?.approvedCount || 0} {lang === 'bn' ? 'জন' : ''}
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            {lang === 'bn' ? 'পেন্ডিং আবেদন' : 'Pending'}
          </span>
          <div className="text-base sm:text-lg font-black text-amber-700 font-mono">
            {referralData?.pendingCount || 0} {lang === 'bn' ? 'জন' : ''}
          </div>
        </div>

        {/* Card 4: Total Referral Bonus */}
        <div className="bg-[#eafff3] border border-[#c6f6dd] rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
            {lang === 'bn' ? 'বোনাস আয়' : 'Bonus Earned'}
          </span>
          <div className="text-base sm:text-lg font-black text-[#009245] font-mono">
            ৳{(referralData?.bonusEarned || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Share Section (Compact & Clean) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Box 1: Referral Code */}
        <div className="bg-[#fdf2f8] border border-pink-100 rounded-xl p-3 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            {lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-pink-200 rounded-lg py-1.5 px-3 text-center font-mono font-black text-base text-pink-600 tracking-wider shadow-inner select-all">
              {refCode}
            </div>
            <button 
              onClick={handleCopyCode}
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                copiedCode ? 'bg-emerald-500 text-white' : 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-50'
              }`}
              title={lang === 'bn' ? 'কোড কপি' : 'Copy Code'}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Box 2: Online Invitation Link */}
        <div className="bg-[#f0faf3] border border-emerald-100 rounded-xl p-3 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            {lang === 'bn' ? 'অনলাইন ইনভাইটেশন লিংক' : 'Invitation Link'}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-emerald-200 rounded-lg py-1.5 px-2.5 text-xs font-mono text-slate-600 truncate shadow-inner select-all">
              {referralLink}
            </div>
            <button 
              onClick={handleCopyLink}
              className={`px-2.5 py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                copiedLink ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              }`}
              title={lang === 'bn' ? 'লিংক কপি' : 'Copy Link'}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে ইনভাইটেশন লিংক শেয়ার' : 'Share on WhatsApp'}</span>
          </a>
        </div>
      </div>

      {/* Clean & Encouraging Referral Section (Replacing internal pricing & profit-sharing details) */}
      <div className="bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#009245] shrink-0 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black text-emerald-950">
              {lang === 'bn' ? 'বন্ধুদের আমন্ত্রণ জানান, রেফারেল বোনাস উপার্জন করুন!' : 'Invite Friends, Earn Referral Bonus!'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার রেফারেল লিংক শেয়ার করুন। আপনার আমন্ত্রিত ব্যক্তি যোগ্যতা পূরণ করে কার্যক্রম শুরু করলে আপনি প্রযোজ্য নিয়ম অনুযায়ী বোনাস পেতে পারেন। আপনার রেফারেল কার্যক্রম ও অর্জিত বোনাসের তথ্য ড্যাশবোর্ডে দেখুন।'
                : 'Share your referral link. When your invited person meets the criteria and starts activity, you can earn applicable bonuses. Track your referral activity and earned bonuses in your dashboard.'}
            </p>
          </div>
        </div>
      </div>

      {/* Referral Members List */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">আপনার নেটওয়ার্ক সদস্যবৃন্দ</h3>
            <span className="text-[11px] font-bold text-slate-400">সর্বমোট {referralData?.referrals.length || 0} জন</span>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={lang === 'bn' ? 'নাম বা মোবাইল দিয়ে খুঁজুন...' : 'Search by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {referralData && filteredReferrals.length > 0 ? (
          <>
            {/* Mobile View: Compact 2-Line Cards */}
            <div className="block sm:hidden p-2.5 space-y-2">
              {filteredReferrals.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2"
                >
                  {/* Line 1: Reseller Name & Visible Phone Number */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center text-[#009245]">
                        {ref.avatarUrl ? (
                          <img src={ref.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{ref.name}</h4>
                        <p className="text-[11px] text-slate-600 font-bold font-mono leading-tight">{ref.phone}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                      ref.status === 'APPROVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {ref.status === 'APPROVED' ? 'সক্রিয়' : 'পেন্ডিং'}
                    </span>
                  </div>

                  {/* Line 2: Total Order Count & Total Profit/Bonus */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <span className="text-[11px] text-slate-500">মোট অর্ডার:</span>
                      <span className="font-black text-slate-900">{ref.orderCount || 0}টি</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500">মোট বোনাস:</span>
                      <span className="font-black text-emerald-600 font-mono">৳{(ref.referralCommission || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet View: Full Table */}
            <div className="hidden sm:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">সদস্যের নাম ও ফোন</th>
                    <th className="px-4 py-4 text-center">স্ট্যাটাস</th>
                    <th className="px-4 py-4 text-center">মোট অর্ডার</th>
                    <th className="px-4 py-4 text-center">মোট বোনাস</th>
                    <th className="px-6 py-4 text-right">নিবন্ধন তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {ref.avatarUrl ? (
                              <img src={ref.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{ref.name}</h4>
                            <span className="text-[11px] text-slate-600 font-bold font-mono">{ref.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          ref.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {ref.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {ref.status === 'APPROVED' ? 'সক্রিয়' : 'পেন্ডিং'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <span className="text-xs font-black text-slate-700">{ref.orderCount || 0}টি</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <span className="text-xs font-black text-emerald-600 font-mono">৳{(ref.referralCommission || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-[11px] text-slate-500 font-bold font-mono">
                           {new Date(ref.registeredAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                {searchTerm ? 'অনুসন্ধান অনুযায়ী কেউ নেই' : 'এখনো কোনো রেফারেল যুক্ত হয়নি'}
              </p>
              <p className="text-xs text-slate-500 font-bold mt-1 max-w-xs mx-auto">
                {searchTerm ? 'দয়া করে অন্য কোনো নাম বা মোবাইল নম্বর দিয়ে চেষ্টা করুন।' : 'আপনার রেফারেল কোড ব্যবহার করে অন্যদের ইনভাইট করুন এবং বাড়তি কমিশন আয় করুন।'}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

