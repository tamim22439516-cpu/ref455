import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Transaction, Sale, Withdrawal } from '../../types/index.js';

interface ResellerEarningsTabProps {
  transactionsList: Transaction[];
  salesList: Sale[];
  withdrawalsList?: Withdrawal[];
}

export const ResellerEarningsTab: React.FC<ResellerEarningsTabProps> = ({
  transactionsList,
  salesList,
  withdrawalsList = [],
}) => {
  const { lang, employee } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!employee) return null;

  const rawTxList = Array.isArray(transactionsList) ? transactionsList : [];
  const rawWdrList = Array.isArray(withdrawalsList) ? withdrawalsList : [];

  // Build unified transaction ledger
  const unifiedTxMap = new Map<string, any>();

  // 1. Add all backend transactions
  for (const t of rawTxList) {
    if (!t || !t.id) continue;
    unifiedTxMap.set(t.id, { ...t });
  }

  // 2. Merge withdrawals into ledger if not already represented as WITHDRAWAL_REQUEST
  for (const w of rawWdrList) {
    if (!w || !w.id) continue;
    const existingTx = Array.from(unifiedTxMap.values()).find(
      (t) => t.reference === w.id || t.id === `trx-${w.id}`
    );
    if (!existingTx) {
      unifiedTxMap.set(`wdr-tx-${w.id}`, {
        id: `wdr-tx-${w.id}`,
        employeeId: employee.id,
        type: 'WITHDRAWAL_REQUEST',
        amount: w.amount,
        balanceAfter: 0,
        status: (w.status as string) === 'APPROVED' || (w.status as string) === 'PAID' ? 'COMPLETED' : (w.status as string) === 'REJECTED' ? 'REJECTED' : 'PENDING',
        reference: w.id,
        description: `উইথড্রয়াল রিকোয়েস্ট (${w.paymentMethod || 'Wallet'}${w.accountNumber ? ` - ${w.accountNumber}` : ''})`,
        timestamp: w.requestDate || (w as any).createdAt || new Date().toISOString(),
      });
    }
  }

  const allLedgerItems = Array.from(unifiedTxMap.values());

  // Sort ASCENDING by timestamp (oldest first) to compute running balance line-by-line
  allLedgerItems.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
    const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  // Track seen withdrawal references so we never double-deduct the same withdrawal ID
  const processedWithdrawalRefs = new Set<string>();

  // Calculate line-by-line running balance chronologically
  let runningBal = 0;
  const processedAscending = allLedgerItems.map((item) => {
    const typeUpper = (item.type || '').toUpperCase();
    const descLower = (item.description || '').toLowerCase();
    const refId = item.reference || item.id;

    const isPenalty =
      typeUpper === 'COURIER_PENALTY' ||
      typeUpper === 'PENALTY' ||
      (typeUpper === 'ADJUSTMENT' && (item.amount < 0 || descLower.includes('কর্তন') || descLower.includes('বাতিল') || descLower.includes('চার্জ'))) ||
      (item.amount < 0 && !typeUpper.includes('WITHDRAWAL'));

    const isWithdrawalRequest = typeUpper === 'WITHDRAWAL_REQUEST' || typeUpper === 'WITHDRAWAL';
    const isWithdrawalPaid = typeUpper === 'WITHDRAWAL_PAID';
    const isRefund = typeUpper === 'WITHDRAWAL_REFUND';

    let netDelta = 0;
    let isDoubleCountedWdr = false;

    if (isPenalty) {
      netDelta = -Math.abs(item.amount);
    } else if (isWithdrawalRequest) {
      if (refId) processedWithdrawalRefs.add(refId);
      netDelta = -Math.abs(item.amount);
    } else if (isWithdrawalPaid) {
      // If we already deducted this withdrawal via WITHDRAWAL_REQUEST, netDelta is 0 (informational payout entry)!
      if (refId && processedWithdrawalRefs.has(refId)) {
        isDoubleCountedWdr = true;
        netDelta = 0;
      } else {
        if (refId) processedWithdrawalRefs.add(refId);
        netDelta = -Math.abs(item.amount);
      }
    } else if (isRefund) {
      netDelta = Math.abs(item.amount);
    } else {
      netDelta = item.amount > 0 ? item.amount : -Math.abs(item.amount);
    }

    runningBal += netDelta;

    return {
      ...item,
      netDelta,
      isPenalty,
      isWithdrawal: isWithdrawalRequest || isWithdrawalPaid,
      isDoubleCountedWdr,
      isRefund,
      calculatedBalanceAfter: runningBal,
    };
  });

  // Now REVERSE to display NEWEST FIRST (newest date & time at the top, oldest at the bottom)
  const sortedNewestFirst = [...processedAscending].reverse();

  // Compute breakdown totals for Summary Cards
  const totalSalesCommission = processedAscending
    .filter((t) => (t.type || '').toUpperCase().includes('COMMISSION') && !t.isPenalty)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSalesPenalties = processedAscending
    .filter((t) => t.isPenalty)
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const netSalesProfit = totalSalesCommission - totalSalesPenalties;

  const referralBonusTotal = processedAscending
    .filter((t) => (t.type || '').toUpperCase() === 'REFERRAL_BONUS' || (t.description || '').toLowerCase().includes('রেফারেল'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalAdminTopups = processedAscending
    .filter((t) => (t.type || '').toUpperCase() === 'BALANCE_TOPUP')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalRequestedWithdrawals = (employee.wallet?.pendingWithdrawal || 0) + (employee.wallet?.totalWithdrawn || 0);

  const directProductSalesCount = (salesList || []).filter(
    (s) => s.saleStatus === 'Approved' || (s.paymentStatus === 'PAID' && s.saleStatus !== 'Rejected')
  ).length;

  // Search filter
  const filteredLedger = sortedNewestFirst.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (item.description || '').toLowerCase().includes(q) ||
      (item.reference || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Proof Transparency Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#009245]/90 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {lang === 'bn' ? 'অ্যালগরিদম সম্বলিত স্বচ্ছ ওয়ালেট ও ইনকাম সামারি' : 'Transparent Wallet & Income Ledger'}
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {lang === 'bn'
              ? 'আপনার অ্যাকাউন্টের প্রতিটি টাকার আগমন ও নির্গমন গাণিতিকভাবে এখানে প্রমাণিত ও সংরক্ষিত।'
              : 'Line-by-line mathematical proof of all credits, deposits, penalties & payouts.'}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shrink-0 flex items-center gap-3">
          <Wallet className="w-6 h-6 text-emerald-400" />
          <div>
            <span className="text-[10px] text-slate-300 uppercase font-bold block leading-none">
              {lang === 'bn' ? 'বর্তমান উত্তোলনযোগ্য ব্যালেন্স' : 'Current Available Balance'}
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-white leading-tight">
              ৳{(employee.wallet?.availableBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Comprehensive 5-Card Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card A: Product Sales Net Profit */}
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'পণ্য বিক্রি প্রফিট (নেট)' : 'Sales Net Profit'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#009245] flex items-center justify-center font-bold shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-base sm:text-xl font-black font-mono tracking-tight ${netSalesProfit < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {netSalesProfit < 0 ? `-৳${Math.abs(netSalesProfit).toLocaleString()}` : `৳${netSalesProfit.toLocaleString()}`}
            </div>
            <p className="text-[9.5px] text-emerald-700 font-bold truncate mt-0.5">
              {directProductSalesCount} {lang === 'bn' ? 'টি বিক্রি' : 'sales'} {totalSalesPenalties > 0 ? `(৳${totalSalesPenalties} চার্জ বাদ)` : ''}
            </p>
          </div>
        </div>

        {/* Card B: Referral Bonus */}
        <div className="bg-sky-50/70 border border-sky-300 rounded-2xl p-3 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'রেফারেল বোনাস' : 'Referral Bonus'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              ৳{referralBonusTotal.toLocaleString()}
            </div>
            <p className="text-[9.5px] text-sky-700 font-bold truncate mt-0.5">
              {lang === 'bn' ? 'নেটওয়ার্ক রিওয়ার্ড' : 'Rewards'}
            </p>
          </div>
        </div>

        {/* Card C: Admin Top-up / Deposit */}
        <div className="bg-indigo-50/70 border border-indigo-300 rounded-2xl p-3 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'ব্যালেন্স টপ-আপ (জমা)' : 'Balance Topups'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-[#009245] font-mono tracking-tight">
              +৳{totalAdminTopups.toLocaleString()}
            </div>
            <p className="text-[9.5px] text-indigo-700 font-bold truncate mt-0.5">
              {lang === 'bn' ? 'অনুমোদিত ডিপোজিট' : 'Approved Deposits'}
            </p>
          </div>
        </div>

        {/* Card D: Withdrawals & Payouts */}
        <div className="bg-rose-50/70 border border-rose-300 rounded-2xl p-3 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'মোট উত্তোলন (উইথড্র)' : 'Total Withdrawals'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-xl font-black text-rose-700 font-mono tracking-tight">
              -৳{totalRequestedWithdrawals.toLocaleString()}
            </div>
            <p className="text-[9.5px] text-rose-700 font-bold truncate mt-0.5">
              {lang === 'bn' ? 'পেন্ডিং ও পেআউট' : 'Pending & Paid'}
            </p>
          </div>
        </div>

        {/* Card E: Current Available Balance */}
        <div className="col-span-2 lg:col-span-1 bg-amber-50/70 border-2 border-amber-400 rounded-2xl p-3 sm:p-4 shadow-3xs flex flex-col justify-between space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase leading-tight line-clamp-2">
              {lang === 'bn' ? 'বর্তমান মোট ওয়ালেট' : 'Available Wallet'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              ৳{(employee.wallet?.availableBalance || 0).toLocaleString()}
            </div>
            <p className="text-[9.5px] text-amber-800 font-bold truncate mt-0.5">
              {lang === 'bn' ? 'উত্তোলন প্রস্তুত' : 'Ready to withdraw'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Detailed Formula Proof Card */}
      <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 sm:p-4 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs font-bold leading-relaxed">
            <span className="text-slate-900 font-black">
              {lang === 'bn' ? 'ব্যালেন্সের গাণিতিক প্রমাণ:' : 'Wallet Formula Proof:'}
            </span>{' '}
            ({netSalesProfit >= 0 ? `+৳${netSalesProfit}` : `-৳${Math.abs(netSalesProfit)}`} প্রফিট) + (৳{totalAdminTopups} টপ-আপ) + (৳{referralBonusTotal} বোনাস) - (৳{totalRequestedWithdrawals} উইথড্র) ={' '}
            <span className="font-mono font-black text-emerald-700 underline decoration-emerald-500 decoration-2">
              ৳{(employee.wallet?.availableBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md shrink-0 self-end sm:self-center">
          {lang === 'bn' ? 'স্বচ্ছ হিসাব' : 'Verified Ledger'}
        </span>
      </div>

      {/* 4. Complete Transaction History Ledger */}
      <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#009245]" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {lang === 'bn' ? 'আর্নিং ও ইনকাম ডিটেইলস লেজার (সর্বশেষ লেনদেন সবার উপরে)' : 'Income Details Ledger (Newest First)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'bn' ? 'ক্রমানুসারে সকল জমা, টপ-আপ, কর্তন ও উত্তোলনের প্রতিটি হিসাবের সঠিক রেকর্ড' : 'Chronological line-by-line record of all transactions & wallet balance updates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'bn' ? 'অর্ডার বা আইডি খুঁজুন...' : 'Search ref or ID...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#009245]"
              />
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
              {filteredLedger.length} {lang === 'bn' ? 'টি লেনদেন' : 'entries'}
            </span>
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transaction records found.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold text-[11px] bg-slate-50/90">
                    <th className="p-3 font-bold">{lang === 'bn' ? 'ইনকামের উৎস ও বিবরণ' : 'Description & Type'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'রেফারেন্স / অর্ডার আইডি' : 'Reference ID'}</th>
                    <th className="p-3 font-bold">{lang === 'bn' ? 'তারিখ ও সময় (নতুন তারিখ উপরে)' : 'Date & Time'}</th>
                    <th className="p-3 font-bold text-right">{lang === 'bn' ? 'লেনদেন এর পরিমাণ' : 'Amount'}</th>
                    <th className="p-3 font-bold text-right">{lang === 'bn' ? 'আপডেটেড ব্যালেন্স' : 'Updated Balance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredLedger.map((item) => {
                    const isCredit = item.netDelta > 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isCredit ? 'bg-[#009245]' : 'bg-rose-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block leading-snug">
                                {item.description}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.isPenalty && (
                                  <span className="text-[9.5px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                    {lang === 'bn' ? 'কুরিয়ার পেনাল্টি কর্তন' : 'Courier Penalty'}
                                  </span>
                                )}
                                {item.isDoubleCountedWdr ? (
                                  <span className="text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                    {lang === 'bn' ? 'উইথড্রয়াল অনুমোদন সম্পন্ন' : 'Payout Completed'}
                                  </span>
                                ) : item.isWithdrawal ? (
                                  <span className="text-[9.5px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                    {lang === 'bn' ? 'উইথড্রয়াল আবেদন' : 'Withdrawal Request'}
                                  </span>
                                ) : null}
                                {item.isRefund && (
                                  <span className="text-[9.5px] font-black bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                                    {lang === 'bn' ? 'উইথড্রয়াল রিফান্ড' : 'Withdrawal Refund'}
                                  </span>
                                )}
                                {(item.type || '').toUpperCase() === 'BALANCE_TOPUP' && (
                                  <span className="text-[9.5px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                    {lang === 'bn' ? 'অনুমোদিত ডিপোজিট' : 'Approved Topup'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-sky-800 font-bold">
                          {item.reference || item.id || 'N/A'}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {new Date(item.timestamp || item.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-right font-black font-mono text-sm whitespace-nowrap">
                          {item.isDoubleCountedWdr ? (
                            <span className="text-slate-500 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              ৳০ <span className="text-[10px] text-emerald-700 font-bold">(অনুমোদিত)</span>
                            </span>
                          ) : (
                            <span className={isCredit ? 'text-[#009245]' : 'text-rose-600'}>
                              {isCredit ? `+৳${item.netDelta.toLocaleString()}` : `-৳${Math.abs(item.netDelta).toLocaleString()}`}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black font-mono text-slate-900 text-sm whitespace-nowrap">
                          ৳{item.calculatedBalanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Compact Card View (Hidden on desktop) */}
            <div className="md:hidden space-y-3">
              {filteredLedger.map((item) => {
                const isCredit = item.netDelta > 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-3xs space-y-2 hover:border-[#009245]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {item.description}
                        </span>
                        <span className="text-[10px] text-sky-700 font-mono font-bold block mt-0.5">
                          Ref: {item.reference || item.id}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono text-xs font-black block ${item.isDoubleCountedWdr ? 'text-slate-500' : isCredit ? 'text-[#009245]' : 'text-rose-600'}`}>
                          {item.isDoubleCountedWdr ? '৳০ (অনুমোদিত)' : isCredit ? `+৳${item.netDelta.toLocaleString()}` : `-৳${Math.abs(item.netDelta).toLocaleString()}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 font-bold block">
                          ব্যালেন্স: ৳{item.calculatedBalanceAfter.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium pt-1.5 border-t border-slate-100">
                      <span className="font-mono">
                        {new Date(item.timestamp || item.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {item.isPenalty && (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                          {lang === 'bn' ? 'চার্জ কর্তন' : 'Penalty'}
                        </span>
                      )}
                      {item.isWithdrawal && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                          {lang === 'bn' ? 'উইথড্র' : 'Withdrawal'}
                        </span>
                      )}
                      {(item.type || '').toUpperCase() === 'BALANCE_TOPUP' && (
                        <span className="text-[9px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {lang === 'bn' ? 'টপ-আপ' : 'Topup'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

