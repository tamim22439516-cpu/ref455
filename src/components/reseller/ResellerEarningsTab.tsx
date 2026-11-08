import React from 'react';
import {
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Calendar,
  Wallet,
  ShoppingBag,
  Users,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Transaction, Sale } from '../../types/index.js';

interface ResellerEarningsTabProps {
  transactionsList: Transaction[];
  salesList: Sale[];
}

export const ResellerEarningsTab: React.FC<ResellerEarningsTabProps> = ({
  transactionsList,
  salesList,
}) => {
  const { lang, employee } = useApp();
  if (!employee) return null;

  const commissionTransactions = transactionsList.filter(
    (t) => ['COMMISSION_EARNED', 'COMMISSION', 'REFERRAL_BONUS', 'BONUS', 'BALANCE_TOPUP', 'ADJUSTMENT'].includes((t.type || '').toUpperCase())
  );

  // Calculate breakdown stats
  const totalSalesProfit = commissionTransactions
    .filter(t => !((t.description || '').toLowerCase().includes('referral') || (t.description || '').toLowerCase().includes('রেফারেল') || (t.reference || '').toLowerCase().includes('ref') || (t.description || '').toLowerCase().includes('টপ-আপ') || t.type === 'BALANCE_TOPUP'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const referralBonusTotal = commissionTransactions
    .filter(t => (t.description || '').toLowerCase().includes('referral') || (t.description || '').toLowerCase().includes('রেফারেল') || (t.reference || '').toLowerCase().includes('ref'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const directProductSalesCount = salesList.filter(s => s.saleStatus === 'Approved' || (s.paymentStatus === 'PAID' && s.saleStatus !== 'Rejected')).length;

  return (
    <div className="space-y-6">
      
      {/* 1. Summary Cards for Earnings Sources - 3 in one row on mobile & desktop */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        {/* Card A: Product Sales Profit */}
        <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'পণ্য বিক্রি থেকে প্রফিট' : 'Product Sales Profit'}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-[#009245] flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              ৳{totalSalesProfit.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-[10px] text-emerald-700 font-bold truncate">
              {directProductSalesCount} {lang === 'bn' ? 'টি সফল বিক্রি' : 'sales'}
            </p>
          </div>
        </div>

        {/* Card B: Referral & Network Bonus */}
        <div className="bg-sky-50/60 border-2 border-sky-300 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'রেফারেল ও নেটওয়ার্ক বোনাস' : 'Referral Network Bonus'}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              ৳{referralBonusTotal.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-[10px] text-sky-700 font-bold truncate">
              {lang === 'bn' ? 'রেফারেল বোনাস' : 'From invites'}
            </p>
          </div>
        </div>

        {/* Card C: Total Balance / Available */}
        <div className="bg-amber-50/60 border-2 border-amber-300 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'বর্তমান উত্তোলনযোগ্য ব্যালেন্স' : 'Withdrawable Balance'}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className={`text-sm sm:text-xl font-black font-mono tracking-tight ${employee.wallet.availableBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {employee.wallet.availableBalance < 0 ? `-৳${Math.abs(employee.wallet.availableBalance).toLocaleString()}` : `৳${employee.wallet.availableBalance.toLocaleString()}`}
            </div>
            <p className="text-[9px] sm:text-[10px] text-amber-800 font-bold truncate">
              {lang === 'bn' ? 'উইথড্র প্রস্তুত' : 'Ready'}
            </p>
          </div>
        </div>
      </div>

      {/* Commission Earnings History Ledger */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#009245]" />
            <h3 className="text-sm font-black text-slate-900">
              {lang === 'bn' ? 'আর্নিং ও ইনকাম ডিটেইলস লেজার (প্রতিটি লেনদেনের স্বচ্ছ হিসাব)' : 'Detailed Income & Earnings Ledger'}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {commissionTransactions.length} {lang === 'bn' ? 'টি সফল এন্ট্রি' : 'entries'}
          </span>
        </div>

        {commissionTransactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'bn' ? 'এখনো কোনো কমিশন বা ইনকাম জমা হয়নি।' : 'No commissions recorded yet.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] bg-slate-50/80">
                    <th className="p-3 font-bold">{lang === 'bn' ? 'ইনকামের উৎস ও বিবরণ' : 'Income Source & Details'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'রেফারেন্স / অর্ডার আইডি' : 'Reference / Order ID'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                    <th className="p-3 font-bold text-right">{lang === 'bn' ? 'যোগ হওয়া টাকা' : 'Credit Amount'}</th>
                    <th className="p-3 font-bold text-right">{lang === 'bn' ? 'আপডেটেড ব্যালেন্স' : 'Updated Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {commissionTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-3 font-black text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#009245] shrink-0" />
                        <span>{item.description}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-sky-800 font-bold">
                        {item.reference || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {new Date(item.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-emerald-700 text-sm">
                        +৳{item.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-slate-900 text-sm">
                        ৳{item.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Compact Card View (Hidden on desktop) */}
            <div className="md:hidden space-y-2.5">
              {commissionTransactions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-3xs space-y-1.5 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {item.description}
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      +৳{item.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                    <span className="font-mono text-sky-700 font-bold truncate">
                      {item.reference || 'N/A'}
                    </span>
                    <span className="font-mono shrink-0">
                      {new Date(item.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
