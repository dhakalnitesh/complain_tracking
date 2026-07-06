import { useState, useRef, useEffect } from 'react';

export default function SearchSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  // Determine if options are grouped
  const isGrouped = options.length > 0 && options[0].options;

  // Flatten for searching
  const flatOptions = isGrouped
    ? options.flatMap(g => g.options.map(o => ({ ...o, group: g.label })))
    : options;

  // Find selected label
  const selected = flatOptions.find(o => o.value === value);
  const displayText = selected?.label || '';

  const filtered = query
    ? flatOptions.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.group && o.group.toLowerCase().includes(query.toLowerCase()))
      )
    : flatOptions;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setHighlightIdx(-1);
  }, [query, open]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0 && filtered[highlightIdx]) {
      e.preventDefault();
      selectOption(filtered[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIdx];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx]);

  function selectOption(opt) {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  const groupedFiltered = isGrouped
    ? options
        .map(g => ({
          ...g,
          options: g.options.filter(o =>
            query
              ? o.label.toLowerCase().includes(query.toLowerCase())
              : true
          ),
        }))
        .filter(g => g.options.length > 0)
    : [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : displayText}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all cursor-text ${
            disabled
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : error
              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500'
              : 'border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:shadow-sm'
          } pr-10`}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-200/50 max-h-60 overflow-y-auto" role="listbox">
          {isGrouped ? (
            groupedFiltered.length > 0 ? (
              groupedFiltered.map((group, gi) => (
                <div key={gi}>
                  <div className="px-3.5 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50 sticky top-0">
                    {group.label}
                  </div>
                  {group.options.map((opt, oi) => {
                    const idx = flatOptions.findIndex(f => f.value === opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectOption(opt)}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        role="option"
                        aria-selected={value === opt.value}
                        className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${
                          value === opt.value
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : highlightIdx === idx
                            ? 'bg-gray-50 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-3.5 py-6 text-center text-sm text-gray-400">
                No results found
              </div>
            )
          ) : (
            filtered.length > 0 ? (
              filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  role="option"
                  aria-selected={value === opt.value}
                  className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    value === opt.value
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : highlightIdx === idx
                      ? 'bg-gray-50 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {value === opt.value && (
                    <svg className="w-4 h-4 shrink-0 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={value === opt.value ? '' : 'ml-6'}>{opt.label}</span>
                </button>
              ))
            ) : (
              <div className="px-3.5 py-6 text-center text-sm text-gray-400">
                No results found
              </div>
            )
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
