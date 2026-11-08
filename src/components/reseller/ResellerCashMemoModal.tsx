import React, { useState } from 'react';
import { X, FileText, Download, Check, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export interface CashMemoItem {
  nameBn: string;
  productCode?: string;
  size?: string;
  quantity: number;
  sellingPrice: number;
}

export interface CashMemoData {
  orderId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  fullAddress: string;
  items: CashMemoItem[];
  productsTotalAmount: number;
  deliveryFee: number;
  grandTotalAmount: number;
}

interface ResellerCashMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoData: CashMemoData | null;
}

export const ResellerCashMemoModal: React.FC<ResellerCashMemoModalProps> = ({
  isOpen,
  onClose,
  memoData,
}) => {
  const { lang, showToast } = useApp();
  const [resellerPageName, setResellerPageName] = useState(
    () => localStorage.getItem('reseller_page_name') || ''
  );
  const [isMemoGenerated, setIsMemoGenerated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !memoData) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const itemsCount = memoData.items.length;
      const canvasWidth = 600;
      const canvasHeight = 720 + (itemsCount * 55);

      const scale = 3; // Ultra HD (Retina 3x scale)
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2d context');

      ctx.scale(scale, scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. White Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. Top Bar
      ctx.fillStyle = '#15803d'; // Rich forest green
      ctx.fillRect(0, 0, canvasWidth, 14);
      ctx.fillStyle = '#d97706'; // Golden yellow accent line
      ctx.fillRect(0, 14, canvasWidth, 3);

      // 3. Draw Outer Border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 25, canvasWidth - 16, canvasHeight - 33);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 29, canvasWidth - 24, canvasHeight - 41);

      // 4. Subtle security seal watermark
      ctx.save();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.strokeStyle = 'rgba(21, 128, 61, 0.05)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(21, 128, 61, 0.05)';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px "Arial", sans-serif';
      ctx.fillText('ORIGINAL MEMO', 0, -10);
      ctx.fillText('★ VERIFIED ★', 0, 15);
      ctx.restore();

      // 5. Header: Page Name
      ctx.fillStyle = '#15803d';
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Arial", sans-serif';
      ctx.fillText((resellerPageName || 'ONLINE SHOP').toUpperCase(), canvasWidth / 2, 68);

      // Subtitle
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px "Arial", sans-serif';
      ctx.fillText('ক্যাশ মেমো ও ডেলিভারি ইনভয়েস', canvasWidth / 2, 90);

      // Divider Line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(35, 108);
      ctx.lineTo(canvasWidth - 35, 108);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Memo Meta Details
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px "Arial", sans-serif';
      ctx.fillText(`মেমো নং: `, 35, 138);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px "Arial", sans-serif';
      ctx.fillText(memoData.orderId, 95, 138);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px "Arial", sans-serif';
      ctx.fillText(`তারিখ: `, canvasWidth - 190, 138);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px "Arial", sans-serif';
      ctx.fillText(memoData.date, canvasWidth - 35, 138);

      // 7. Customer Info Box
      const boxY = 160;
      const boxHeight = 115;
      const boxWidth = canvasWidth - 70;

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(35, boxY, boxWidth, boxHeight, 14);
      } else {
        ctx.rect(35, boxY, boxWidth, boxHeight);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(35, boxY, 6, boxHeight, [14, 0, 0, 14]);
      } else {
        ctx.fillRect(35, boxY, 6, boxHeight);
      }
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px "Arial", sans-serif';
      ctx.fillText('কাস্টমারের নাম:', 55, boxY + 32);
      ctx.fillText('মোবাইল নম্বর:', 55, boxY + 62);
      ctx.fillText('ডেলিভারি ঠিকানা:', 55, boxY + 92);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px "Arial", sans-serif';
      ctx.fillText(memoData.customerName, 175, boxY + 32);
      ctx.font = 'bold 14px "Arial", sans-serif';
      ctx.fillText(memoData.customerPhone, 175, boxY + 62);

      ctx.font = 'bold 13px "Arial", sans-serif';
      const addressText = memoData.fullAddress;
      const maxAddressWidth = canvasWidth - 230;
      ctx.fillText(addressText, 175, boxY + 92, maxAddressWidth);

      // 8. Product List Table Header
      let currentY = boxY + boxHeight + 35;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(35, currentY, boxWidth, 38, [10, 10, 0, 0]);
      } else {
        ctx.fillRect(35, currentY, boxWidth, 38);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Arial", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('পণ্য বিবরণী', 50, currentY + 24);
      ctx.textAlign = 'center';
      ctx.fillText('পরিমাণ', canvasWidth / 2 + 50, currentY + 24);
      ctx.textAlign = 'right';
      ctx.fillText('মূল্য', canvasWidth - 50, currentY + 24);

      // Items Rows
      currentY += 38;
      memoData.items.forEach((item: any, idx: number) => {
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(35, currentY, boxWidth, 50);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(35, currentY, boxWidth, 50);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px "Arial", sans-serif';
        ctx.fillText(item.nameBn, 50, currentY + 20, 260);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10.5px "Arial", sans-serif';
        const pCode = item.productCode ? `#${item.productCode}` : '';
        const sizeText = item.size ? ` [সাইজ: ${item.size}]` : '';
        ctx.fillText(`${pCode}${sizeText}`, 50, currentY + 38);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px "Arial", sans-serif';
        ctx.fillText(`${item.quantity} পিস`, canvasWidth / 2 + 50, currentY + 29);

        ctx.textAlign = 'right';
        ctx.font = 'bold 13px "Arial", sans-serif';
        ctx.fillText(`৳${(item.sellingPrice * item.quantity).toLocaleString()}`, canvasWidth - 50, currentY + 29);

        currentY += 50;
      });

      // 9. Totals Summary Card
      currentY += 20;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(35, currentY, boxWidth, 115, 12);
      } else {
        ctx.rect(35, currentY, boxWidth, 115);
      }
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px "Arial", sans-serif';
      ctx.fillText('পণ্যের মূল্য:', 55, currentY + 30);
      ctx.fillText('ডেলিভারি চার্জ:', 55, currentY + 60);

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 14px "Arial", sans-serif';
      ctx.fillText('সর্বমোট দেয় বিল (COD):', 55, currentY + 92);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px "Arial", sans-serif';
      ctx.fillText(`৳${memoData.productsTotalAmount.toLocaleString()}`, canvasWidth - 55, currentY + 30);
      ctx.fillText(`৳${memoData.deliveryFee}`, canvasWidth - 55, currentY + 60);

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 17px "Arial", sans-serif';
      ctx.fillText(`৳${memoData.grandTotalAmount.toLocaleString()}`, canvasWidth - 55, currentY + 92);

      // 10. Signature Section
      currentY += 165;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);

      ctx.beginPath();
      ctx.moveTo(35, currentY - 50);
      ctx.lineTo(155, currentY - 50);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvasWidth - 155, currentY - 50);
      ctx.lineTo(canvasWidth - 35, currentY - 50);
      ctx.stroke();

      ctx.setLineDash([]);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ক্রেতার স্বাক্ষর', 95, currentY - 32);
      ctx.fillText('অনুমোদিত স্বাক্ষর', canvasWidth - 95, currentY - 32);

      // 11. Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Arial", sans-serif';
      ctx.fillText('* আমাদের থেকে কেনাকাটা করার জন্য ধন্যবাদ *', canvasWidth / 2, currentY);

      // Trigger HD download
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `MEMO_${(resellerPageName || 'Shop').replace(/\s+/g, '_')}_${memoData.orderId}.png`;
      link.href = imgData;
      link.click();
      showToast(lang === 'bn' ? 'মেমো ইমেজ সফলভাবে ডাউনলোড হয়েছে!' : 'Memo downloaded!', 'success');
    } catch (err: any) {
      console.error('Canvas download error:', err);
      showToast(lang === 'bn' ? `ডাউনলোড সমস্যা: ${err?.message || err}` : 'Download failed', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100050] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="p-4 bg-[#009245] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-200" />
            <h3 className="text-sm font-black">
              {!isMemoGenerated ? 'মেমো ইনফরমেশন দিন' : 'কাস্টমার ক্যাশ মেমো'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50 text-xs text-slate-800 font-medium">
          {!isMemoGenerated ? (
            /* Step A: Input Page/Brand Name */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#009245] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  আপনার নিজস্ব ক্যাশ মেমো তৈরি করুন
                </h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  মেমোতে আপনার ফেসবুক পেইজ বা প্রতিষ্ঠানের নাম বসবে। এতে আপনার পাইকারি মূল্য, প্রফিট বা কোনো গোপন তথ্য কাস্টমার দেখতে পাবে না।
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  আপনার পেইজ / প্রতিষ্ঠানের নাম দিন <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resellerPageName}
                  onChange={(e) => {
                    setResellerPageName(e.target.value);
                    localStorage.setItem('reseller_page_name', e.target.value);
                  }}
                  placeholder="যেমন: আরিয়ান কালেকশন / My Online Shop"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                />
              </div>

              <button
                type="button"
                disabled={!resellerPageName.trim()}
                onClick={() => setIsMemoGenerated(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <span>মেমো তৈরি করুন 📄</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                স্কিপ করুন
              </button>
            </div>
          ) : (
            /* Step B: Preview Generated Memo */
            <div className="space-y-3">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-slate-800 shadow-2xs">
                {/* Header */}
                <div className="text-center pb-3 border-b-2 border-dashed border-slate-200 space-y-1">
                  <h2 className="text-lg font-black text-emerald-700 tracking-tight leading-tight uppercase">
                    {resellerPageName}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase">
                    ক্যাশ মেমো ও ডেলিভারি ইনভয়েস
                  </p>
                </div>

                {/* Memo Meta details */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                  <span>
                    মেমো নং: <strong className="text-slate-900 font-black">{memoData.orderId}</strong>
                  </span>
                  <span>
                    তারিখ: <strong className="text-slate-900">{memoData.date}</strong>
                  </span>
                </div>

                {/* Customer Info Card */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">কাস্টমারের নাম:</span>
                    <span className="font-black text-slate-900">{memoData.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">মোবাইল নম্বর:</span>
                    <span className="font-black text-slate-900 font-mono">{memoData.customerPhone}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold text-slate-500 shrink-0">ডেলিভারি ঠিকানা:</span>
                    <span className="font-bold text-slate-900 text-right leading-tight">
                      {memoData.fullAddress}
                    </span>
                  </div>
                </div>

                {/* Product List Table */}
                <div className="space-y-1.5">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                          <th className="p-2.5">পণ্য বিবরণী</th>
                          <th className="p-2.5 text-center">পরিমাণ</th>
                          <th className="p-2.5 text-right">মূল্য</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                        {memoData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 leading-snug">
                              <span className="font-black text-slate-900 block truncate max-w-[150px]">
                                {item.nameBn}
                              </span>
                              {item.size && (
                                <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-black mt-0.5 inline-block">
                                  সাইজ: {item.size}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono font-black">{item.quantity} পিস</td>
                            <td className="p-2.5 text-right font-mono font-black text-slate-900">
                              ৳{(item.sellingPrice * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Price Calculations */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">পণ্যের মূল্য:</span>
                    <span className="font-black text-slate-900 font-mono">
                      ৳{memoData.productsTotalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">ডেলিভারি চার্জ:</span>
                    <span className="font-black text-slate-900 font-mono">৳{memoData.deliveryFee}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 text-sm font-black text-emerald-700">
                    <span>সর্বমোট দেয় বিল (COD):</span>
                    <span className="font-mono text-base">
                      ৳{memoData.grandTotalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Footer note */}
                <p className="text-[9.5px] text-center text-slate-400 font-black tracking-wider uppercase pt-1">
                  * আমাদের থেকে কেনাকাটা করার জন্য ধন্যবাদ *
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownload}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'মেমো তৈরি হচ্ছে...' : 'মেমো ডাউনলোড করুন 📥'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMemoGenerated(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>এডিট করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#009245] font-black text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ঠিক আছে</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
