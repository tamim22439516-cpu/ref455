import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { RotateCw } from 'lucide-react';

interface BkashBalanceButtonProps {
  className?: string;
  compact?: boolean;
}

export const BkashBalanceButton: React.FC<BkashBalanceButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const {
    lang,
    employee,
    isEmployeeAuthenticated,
    refreshEmployeeProfile,
    setActivePortal,
    showToast,
  } = useApp();

  const [isShowingBalance, setIsShowingBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently showing balance, tap again hides it immediately
    if (isShowingBalance) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsShowingBalance(false);
      return;
    }

    // If not authenticated, prompt to login
    if (!isEmployeeAuthenticated || !employee) {
      showToast(
        lang === 'bn'
          ? 'ব্যালেন্স দেখতে রিসেলার অ্যাকাউন্টে লগইন করুন।'
          : 'Please login to view reseller balance.',
        'info'
      );
      setActivePortal('employee');
      return;
    }

    // Trigger refreshing animation and fetch latest balance
    setIsRefreshing(true);
    try {
      await refreshEmployeeProfile();
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
      setIsShowingBalance(true);

      // Auto-hide balance after 4.5 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsShowingBalance(false);
      }, 4500);
    }
  };

  const availableBalance = employee?.wallet?.availableBalance ?? 0;

  // Format currency with Bengali or English digits (clean negative prefix support)
  const formattedBalance = availableBalance < 0
    ? `-৳ ${Math.abs(availableBalance).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}`
    : (lang === 'bn'
        ? `৳ ${availableBalance.toLocaleString('bn-BD')}`
        : `৳ ${availableBalance.toLocaleString('en-US')}`);

  return (
    <button
      type="button"
      onClick={handleTap}
      title={
        !isEmployeeAuthenticated
          ? (lang === 'bn' ? 'লগইন করে ব্যালেন্স দেখুন' : 'Login to view balance')
          : (isShowingBalance
              ? (lang === 'bn' ? 'ব্যালেন্স লুকাতে চাপুন' : 'Tap to hide balance')
              : (lang === 'bn' ? 'ব্যালেন্স দেখতে চাপুন' : 'Tap to view balance'))
      }
      aria-label="Check Balance"
      className={`group relative overflow-hidden rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 shadow-sm hover:shadow transition-all duration-200 select-none cursor-pointer flex items-center shrink-0 w-[94px] h-8 pl-1.5 pr-2 gap-1.5 ${className}`}
    >
      {/* Left Icon Badge */}
      <div
        className={`rounded-md ${availableBalance < 0 ? 'bg-rose-600' : 'bg-[#009245]'} text-white flex items-center justify-center font-bold shadow-xs transition-transform duration-200 shrink-0 w-5.5 h-5.5 text-[11px] ${
          isRefreshing ? 'animate-spin' : 'group-hover:scale-105'
        }`}
      >
        {isRefreshing ? (
          <RotateCw className="w-3 h-3 animate-spin" />
        ) : (
          <span className="leading-none select-none font-bold text-center">৳</span>
        )}
      </div>

      {/* Center Label / Balance Value: Frame dimensions locked, animation 100% constrained inside */}
      <div className="flex-1 min-w-0 h-full flex items-center justify-center overflow-hidden">
        {isRefreshing ? (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center animate-pulse whitespace-nowrap">
            {lang === 'bn' ? 'লোড হচ্ছে' : 'Loading'}
          </span>
        ) : isShowingBalance ? (
          <span className={`text-[13px] font-bold ${availableBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#009245] dark:text-emerald-400'} tracking-tight whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 text-center`}>
            {formattedBalance}
          </span>
        ) : (
          <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap animate-in fade-in duration-200 text-center">
            {lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}
          </span>
        )}
      </div>
    </button>
  );
};
