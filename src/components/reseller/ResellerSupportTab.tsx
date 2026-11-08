import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const ResellerSupportTab: React.FC = () => {
  const { lang, brandSettings } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const resellerWhatsapp = brandSettings?.resellerWhatsappNumber || brandSettings?.whatsappNumber || '01700000000';
  const whatsappUrl = resellerWhatsapp.startsWith('http')
    ? resellerWhatsapp
    : `https://wa.me/${resellerWhatsapp.replace(/[^0-9]/g, '')}`;
  const resellerPhone = brandSettings?.resellerHotlinePhone || brandSettings?.resellerContactNumber || brandSettings?.helplinePhone || '01700000000';

  const faqs = [
    {
      qBn: 'আমি কীভাবে পণ্য বিক্রি করে কমিশন উপার্জন করব?',
      qEn: 'How do I earn commission by selling products?',
      aBn: 'প্রোডাক্ট ক্যাটালগ থেকে যেকোনো পণ্য নির্বাচন করে তার ছবি ও বিবরণ আপনার পরিচিত বা সোশ্যাল মিডিয়ায় (ফেসবুক, হোয়াটসঅ্যাপ) শেয়ার করুন। কাস্টমারের কাছ থেকে অর্ডার পেলে “বিক্রির জন্য নিন” বাটনে ক্লিক করে কাস্টমারের নাম, ফোন ও ঠিকানা দিয়ে সেল রেকর্ড করুন। পণ্য সফল ডেলিভারি হলেই কমিশন আপনার ওয়ালেটে যোগ হয়ে যাবে।',
      aEn: 'Select any product from the catalog, share its details on social media. When you get an order, record the customer details via "Take for Selling". Commission is credited upon delivery.',
    },
    {
      qBn: 'পণ্য ডেলিভারি ও প্যাকেজিং কে সম্পন্ন করে?',
      qEn: 'Who handles product packaging and delivery?',
      aBn: 'তাওযুন নেক্সাস এর কেন্দ্রীয় হাব থেকে সম্পূর্ণ প্যাকেজিং এবং কুরিয়ারের মাধ্যমে কাস্টমারের ঠিকানায় হোম ডেলিভারি পৌঁছে দেওয়া হয়। রিসেলারকে কোনো পণ্য স্টক বা কুরিয়ারে গিয়ে পাঠাতে হবে না।',
      aEn: 'Tawzoon Nexus manages centralized packaging and direct home delivery to your customer.',
    },
    {
      qBn: 'উপার্জিত টাকা কীভাবে বিকাশ বা নগদে তুলতে পারব?',
      qEn: 'How can I withdraw my earnings to bKash or Nagad?',
      aBn: 'আপনার ওয়ালেট ব্যালেন্স সর্বনিম্ন ৫০০ টাকা হলেই আপনি “টাকা উত্তোলন” অপশনে গিয়ে আপনার পার্সোনাল বিকাশ বা নগদ নম্বর দিয়ে আবেদন করতে পারবেন। অ্যাডমিন দ্রুত যাচাই করে টাকা ট্রান্সফার করে দেন।',
      aEn: 'Once your wallet reaches the minimum ৳500 limit, request a payout to bKash or Nagad anytime.',
    },
    {
      qBn: 'রেফারেন্স আইডি দিয়ে কী সুবিধা পাব?',
      qEn: 'What is the purpose of Personal Reference ID?',
      aBn: 'আপনার পার্সোনাল রেফারেন্স আইডি হলো আপনার স্বতন্ত্র রিসেলার পরিচয়পত্র। কাস্টমার সাপোর্ট এবং বিশেষ ইনসেনটিভের জন্য এই আইডি ব্যবহৃত হয়।',
      aEn: 'Your Reference ID is your unique identification code for priority support and affiliate incentives.',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 3 Contact Support Channels in Soft Light-Blue / Green Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* WhatsApp Live Support */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 shadow-xs hover:border-emerald-300 hover:bg-emerald-100/60 transition-all flex items-start gap-4 group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#009245] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              {lang === 'bn' ? 'সরাসরি চ্যাট' : 'Direct Chat'}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              WhatsApp Support
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {lang === 'bn' ? 'যেকোনো জিজ্ঞাসায় দ্রুত সমাধান পেতে মেসেজ দিন' : 'Instant help & guidance'}
            </p>
          </div>
        </a>

        {/* Phone Helpline */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
              {lang === 'bn' ? 'কল সেন্টার' : 'Helpline'}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {resellerPhone}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {lang === 'bn' ? 'সকাল ৯টা থেকে রাত ১০টা পর্যন্ত সক্রিয়' : 'Active 9 AM to 10 PM daily'}
            </p>
          </div>
        </div>

        {/* Email Helpdesk */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'bn' ? 'অফিসিয়াল ইমেইল' : 'Email Desk'}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[180px]">
              support@tawzoonnexus.com
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {lang === 'bn' ? '২৪ ঘণ্টার মধ্যে রিপ্লাই দেওয়া হয়' : 'Response within 24 hours'}
            </p>
          </div>
        </div>

      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <HelpCircle className="w-4 h-4 text-[#009245]" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            {lang === 'bn' ? 'রিসেলার সাধারণ প্রশ্নোত্তর (FAQ)' : 'Reseller Frequently Asked Questions'}
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/70 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <span>{lang === 'bn' ? faq.qBn : faq.qEn}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#009245]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed bg-slate-50/40 border-t border-slate-100">
                    {lang === 'bn' ? faq.aBn : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
