import React, { useState } from 'react';
import {
  X,
  Search,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Loader2,
  Globe,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { api } from '../services/api.js';

interface CustomerHistoryData {
  phone: string;
  totalOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
  pendingOrders: number;
  totalAmountSpent: number;
  successRate: number;
  courierNetwork?: {
    totalParcels: number;
    deliveredParcels: number;
    returnedParcels: number;
    successRate: number;
    riskStatus: 'GREEN' | 'YELLOW' | 'RED';
    riskTextBn: string;
    riskTextEn: string;
    dataSources: string;
  };
  salesHistory: Array<{
    id: string;
    productName: string;
    productCode?: string;
    quantity: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    customerName?: string;
    customerAddress?: string;
  }>;
}

interface CustomerHistorySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
}

export const CustomerHistorySearchModal: React.FC<CustomerHistorySearchModalProps> = ({
  isOpen,
  onClose,
  initialPhone = '',
}) => {
  const { lang, showToast } = useApp();
  const [searchPhone, setSearchPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<CustomerHistoryData | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchPhone || searchPhone.trim().length < 6) {
      showToast(lang === 'bn' ? 'সঠিক মোবাইল নম্বর লিখুন (কমপক্ষে ৬ ডিজিট)' : 'Enter valid phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.getCustomerHistory(searchPhone.trim());
      setHistoryData(data);
    } catch (err: any) {
      showToast(err.message || 'কাস্টমার তথ্য পাওয়া যায়নি', 'error');
    } finally {
      setLoading(false);
    }
  };

  const courier = historyData?.courierNetwork;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-lg rounded-3xl border border-emerald-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#009245] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'কাস্টমার পার্সেল ও ডেলিভারি হিস্ট্রি' : 'Customer Parcel & Delivery History'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'bn' ? 'কাস্টমারের পার্সেল রিসিভ ও রিটার্ন রেকর্ড যাচাই করুন' : 'Check parcel delivery & return history records'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          
          {/* Search Bar Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono font-bold text-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-xs font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{lang === 'bn' ? 'সার্চ করুন' : 'Search'}</span>
            </button>
          </form>

          {/* Results Analytics Display */}
          {historyData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Section 1: Steadfast & National Courier Network Record */}
              {courier && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white space-y-3 border border-slate-700 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black tracking-wide text-emerald-400 uppercase">
                        {lang === 'bn' ? 'কাস্টমার পার্সেল ও ডেলিভারি রেকর্ড' : 'Customer Parcel & Delivery Record'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Delivery History
                    </span>
                  </div>

                  {/* Risk Banner */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                      courier.riskStatus === 'GREEN'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : courier.riskStatus === 'YELLOW'
                        ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    {courier.riskStatus === 'GREEN' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : courier.riskStatus === 'YELLOW' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black block leading-tight">
                        {lang === 'bn' ? courier.riskTextBn : courier.riskTextEn}
                      </span>
                    </div>
                  </div>

                  {/* 4 National Courier Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">{lang === 'bn' ? 'মোট পার্সেল' : 'Total Parcels'}</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {courier.totalParcels}টি
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-700/50 text-center">
                      <span className="text-[10px] text-emerald-300 font-bold block mb-0.5">{lang === 'bn' ? 'মাল নিয়েছে (সফল)' : 'Delivered'}</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                        {courier.deliveredParcels}টি
                      </span>
                    </div>

                    <div className="p-2.5 bg-rose-950/40 rounded-xl border border-rose-700/50 text-center">
                      <span className="text-[10px] text-rose-300 font-bold block mb-0.5">{lang === 'bn' ? 'রিজেক্ট / রিটার্ন' : 'Returned'}</span>
                      <span className="text-sm sm:text-base font-black text-rose-400 font-mono">
                        {courier.returnedParcels}টি
                      </span>
                    </div>

                    <div className="p-2.5 bg-sky-950/40 rounded-xl border border-sky-700/50 text-center">
                      <span className="text-[10px] text-sky-300 font-bold block mb-0.5">{lang === 'bn' ? 'সাকসেস রেট' : 'Success Rate'}</span>
                      <span className="text-sm sm:text-base font-black text-sky-300 font-mono">
                        {courier.successRate}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center font-medium italic pt-1">
                    ডাটা উৎস: অর্ডার ডাটাবেস ও পার্সেল ডেলিভারি হিস্ট্রি রেকর্ড।
                  </p>
                </div>
              )}

              {/* Section 2: This Website Internal Orders */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#009245]" />
                    <span>{lang === 'bn' ? 'আমাদের ওয়েবসাইট অর্ডার রিকর্ড:' : 'Website Order Record:'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {historyData.totalOrders} {lang === 'bn' ? 'টি অর্ডার' : 'Orders'}
                  </span>
                </div>

                {historyData.salesHistory.length === 0 ? (
                  <div className="p-3.5 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium">
                    {lang === 'bn' ? 'আমাদের ওয়েবসাইটে এই নম্বরে পূর্বে কোনো অর্ডারের ডাটা নেই।' : 'No local orders on this website yet.'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {historyData.salesHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-3xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h5 className="text-xs font-black text-slate-900 truncate">
                            {item.productName}
                          </h5>
                          <div className="text-[10.5px] text-slate-500 font-mono font-medium flex items-center gap-2">
                            <span>Code: #{item.productCode || 'TNX'}</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 font-mono block">
                            ৳{item.totalAmount}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              ['delivered', 'completed', 'approved'].includes((item.status || '').toLowerCase())
                                ? 'bg-emerald-100 text-emerald-800'
                                : ['cancelled', 'rejected', 'returned'].includes((item.status || '').toLowerCase())
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
