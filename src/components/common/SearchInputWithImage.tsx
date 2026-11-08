import React, { useRef, useState, useEffect } from 'react';
import { Search, Camera, X, Sparkles, Image as ImageIcon, History, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

interface SearchInputWithImageProps {
  value: string;
  onChange: (value: string) => void;
  onSearchSubmit?: () => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
  onClose?: () => void;
}

export const SearchInputWithImage: React.FC<SearchInputWithImageProps> = ({
  value,
  onChange,
  onSearchSubmit,
  placeholder,
  className = '',
  size = 'md',
  autoFocus = false,
  onClose,
}) => {
  const { lang, startVisualSearch, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tawzoon_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSearchHistory(parsed);
      }
    } catch {}
  }, []);

  // Save term to search history
  const saveToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2 || clean.startsWith('http://') || clean.startsWith('https://')) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('tawzoon_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Delete a single search history item
  const deleteHistoryItem = (e: React.MouseEvent, itemToDelete: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSearchHistory(prev => {
      const updated = prev.filter(item => item !== itemToDelete);
      try {
        localStorage.setItem('tawzoon_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startVisualSearch(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      startVisualSearch(file);
      showToast(lang === 'bn' ? '📷 ছবিটি বিশ্লেষণ করা হচ্ছে...' : '📷 Analyzing image...');
    } else {
      showToast(lang === 'bn' ? 'দয়া করে একটি প্রোডাক্ট ছবি ড্রপ করুন।' : 'Please drop an image file.', 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const triggerSearchAction = () => {
    if (value.trim()) {
      saveToHistory(value);
    }
    setIsFocused(false);
    if (onSearchSubmit) {
      onSearchSubmit();
    } else {
      const el = document.getElementById('catalog-section') || document.getElementById('products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const pyClass = size === 'sm' ? 'py-1.5' : size === 'lg' ? 'py-3' : 'py-2 sm:py-2.5';
  const textClass = size === 'sm' ? 'text-xs font-medium' : size === 'lg' ? 'text-base font-bold' : 'text-sm sm:text-base font-bold';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5';

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex items-center w-full transition-all duration-200 ${
        isDragOver
          ? 'ring-2 ring-[#009245] ring-offset-2 rounded-full scale-[1.01]'
          : ''
      } ${className}`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left Search Icon - Clickable Trigger */}
      <button
        type="button"
        onClick={triggerSearchAction}
        className="absolute left-3.5 text-slate-400 hover:text-[#009245] transition-colors shrink-0 cursor-pointer focus:outline-none z-10"
        title={lang === 'bn' ? 'অনুসন্ধান করুন' : 'Search'}
        aria-label="Search"
      >
        <Search className={`${iconSize}`} />
      </button>

      {/* Main Text Input */}
      <input
        type="text"
        value={value}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            triggerSearchAction();
            if (window.innerWidth < 640 && onClose) {
              (e.target as HTMLInputElement).blur();
            }
          } else if (e.key === 'Escape') {
            setIsFocused(false);
            onClose?.();
          }
        }}
        placeholder={
          isDragOver
            ? (lang === 'bn' ? '✨ ছবি এখানে ছেড়ে দিন...' : '✨ Drop image here...')
            : (placeholder || (lang === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'))
        }
        autoFocus={autoFocus}
        className={`w-full pl-10 pr-14 ${pyClass} ${textClass} bg-[#f4f7f5] dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-800 border ${
          isDragOver
            ? 'border-[#009245] bg-emerald-50 dark:bg-emerald-950/40 text-[#009245]'
            : 'border border-emerald-300/90 dark:border-slate-600 focus:border-[#009245] shadow-2xs'
        } rounded-full outline-none transition-all placeholder:text-slate-400 placeholder:opacity-75 placeholder:font-normal text-slate-900 dark:text-white focus:ring-2 focus:ring-[#009245]/20`}
      />

      {/* Right Action Icons: Clear Text (if any) + Camera / Visual Search Lens */}
      <div className="absolute right-2 sm:right-2.5 flex items-center gap-1.5 z-10">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Camera / Visual Search Trigger Button (Icon Only, Professional & Crisp) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-7 h-7 sm:w-6.5 sm:h-6.5 rounded-full bg-emerald-50 dark:bg-slate-700 hover:bg-[#009245] text-[#009245] dark:text-emerald-300 hover:text-white border border-emerald-300 dark:border-slate-600 transition-all cursor-pointer shadow-2xs group flex items-center justify-center shrink-0 active:scale-95"
          title={lang === 'bn' ? 'ছবি দিয়ে পণ্য খুঁজুন (Visual Search)' : 'Search with image / photo'}
          aria-label="Image Search"
        >
          <Camera className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 group-hover:scale-110 transition-transform shrink-0" />
        </button>
      </div>

      {/* Search History Dropdown Menu */}
      {isFocused && searchHistory.length > 0 && !value.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-150 p-2">
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <span className="flex items-center gap-1">
              <History className="w-3 h-3 text-[#009245]" />
              {lang === 'bn' ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent Searches'}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {searchHistory.map((item, idx) => (
              <div
                key={`hist-${idx}`}
                onClick={() => {
                  onChange(item);
                  triggerSearchAction();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#009245] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#009245] shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => deleteHistoryItem(e, item)}
                  className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                  title={lang === 'bn' ? 'হিস্ট্রি মুছুন' : 'Delete history item'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag Over Overlay Prompt */}
      {isDragOver && (
        <div className="absolute inset-0 bg-[#009245]/90 text-white rounded-full flex items-center justify-center gap-2 text-xs font-bold pointer-events-none shadow-lg animate-pulse z-10">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{lang === 'bn' ? 'ছবি এখানে ছেড়ে দিন (AI অনুসন্ধান)' : 'Drop image here for AI search'}</span>
        </div>
      )}
    </div>
  );
};

