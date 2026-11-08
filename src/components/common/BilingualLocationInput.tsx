import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, X } from 'lucide-react';

export interface LocationOption {
  nameBn: string;
  nameEn: string;
  display: string;
}

interface BilingualLocationInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string, selectedItem?: LocationOption) => void;
  placeholder?: string;
  searchFn: (query: string) => LocationOption[];
  disabled?: boolean;
  emptyHint?: string;
  id?: string;
}

export const BilingualLocationInput: React.FC<BilingualLocationInputProps> = ({
  label,
  required = false,
  value,
  onChange,
  placeholder = '',
  searchFn,
  disabled = false,
  emptyHint = 'কোনো ফলাফল নেই',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync internal search input with value when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute matched options based on user typing
  const options = React.useMemo(() => {
    return searchFn(searchTerm);
  }, [searchFn, searchTerm]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleSelect = (option: LocationOption) => {
    // Put clean English name in the field
    onChange(option.nameEn, option);
    setSearchTerm(option.nameEn);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) {
        handleSelect(options[activeIndex]);
      } else if (options.length === 1) {
        handleSelect(options[0]);
      } else if (searchTerm.trim()) {
        const exactMatch = options.find(
          (o) =>
            o.nameBn.toLowerCase() === searchTerm.trim().toLowerCase() ||
            o.nameEn.toLowerCase() === searchTerm.trim().toLowerCase()
        );
        if (exactMatch) {
          handleSelect(exactMatch);
        } else {
          onChange(searchTerm.trim());
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="space-y-1 relative w-full">
      <label htmlFor={id} className="text-xs font-black text-slate-700 block">
        {label} {required && <span className="text-[#009245]">*</span>}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <MapPin className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : value || ''}
          onChange={(e) => {
            const nextVal = e.target.value;
            setSearchTerm(nextVal);
            onChange(nextVal);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(value || '');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-8 pr-14 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none font-bold text-slate-900 transition-all ${
            disabled
              ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200'
              : isOpen
              ? 'bg-white border-[#009245] ring-2 ring-emerald-500/10 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#009245]'
          }`}
        />

        {/* Clear and Toggle Icons */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setIsOpen(!isOpen);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Clean Floating Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-100">
          <ul
            ref={listRef}
            className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs py-0.5"
          >
            {options.length > 0 ? (
              options.map((option, index) => {
                const isSelected = value.toLowerCase() === option.nameEn.toLowerCase() || value === option.nameBn;
                const isFocused = activeIndex === index;

                return (
                  <li
                    key={`${option.nameBn}-${index}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isFocused
                        ? 'bg-emerald-50 text-emerald-950 font-bold'
                        : isSelected
                        ? 'bg-emerald-50/60 text-[#009245] font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-900 font-bold text-xs">{option.nameEn}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({option.nameBn})
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2.5 text-center text-xs text-slate-400">
                {emptyHint}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
