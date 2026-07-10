import { useEffect, useRef } from 'react';
import '@sajanm/nepali-date-picker/dist/nepali.datepicker.v5.0.6.min.css';
import '@sajanm/nepali-date-picker/dist/nepali.datepicker.v5.0.6.min.js';

export default function NepaliDatePicker({ value, onChange, placeholder = 'Select date', className = '' }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.NepaliDatePicker({
      onChange: function () {
        const bsDateStr = this.value;
        if (bsDateStr && window.NepaliFunctions) {
          const parts = bsDateStr.split('-');
          if (parts.length === 3) {
            const bsYear = parseInt(parts[0]);
            const bsMonth = parseInt(parts[1]);
            const bsDay = parseInt(parts[2]);
            const adDate = window.NepaliFunctions.ConvertToEnglishDate(bsYear, bsMonth, bsDay);
            if (adDate) {
              const adStr = `${adDate.year}-${String(adDate.month).padStart(2, '0')}-${String(adDate.day).padStart(2, '0')}`;
              onChange(adStr);
            }
          }
        }
      },
    });

    return () => {
      if (el.NepaliDatePickerDestroy) {
        el.NepaliDatePickerDestroy();
      }
    };
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || !value || !window.NepaliFunctions) return;
    const date = new Date(value);
    if (isNaN(date.getTime())) return;
    try {
      const bs = window.NepaliFunctions.ConvertToBikramSambat(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      if (bs) {
        el.value = `${bs.bsYear}-${String(bs.bsMonth).padStart(2, '0')}-${String(bs.bsDay).padStart(2, '0')}`;
      }
    } catch (_) {}
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      autoComplete="off"
      placeholder={placeholder}
      readOnly
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer w-full ${className}`}
    />
  );
}
