import { useState, useRef, useEffect } from 'react';
import { route } from 'ziggy-js';
import { useLanguage } from '../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from './UI/Badge';

export default function TrackModal({ open, onClose }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setIssue(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setIssue(null);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(code.trim())}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'No issue found with this reference code.');
      } else {
        const data = await res.json();
        setIssue(data);
      }
    } catch {
      setError('Failed to check status. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            {isNp ? 'उजुरी ट्र्याक गर्नुहोस्' : 'Track Complaint'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {!issue && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNp ? 'सन्दर्भ कोड' : 'Reference Code'}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder={isNp ? 'जस्तै: KMC-0001' : 'e.g. KMC-0001'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <svg className="w-4 h-4 mt-0.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isNp ? 'खोज्दै...' : 'Searching...'}
                  </span>
                ) : (
                  isNp ? 'ट्र्याक गर्नुहोस्' : 'Track'
                )}
              </button>
            </form>
          )}

          {issue && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-gray-900">{issue.reference_code}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{issue.bs_date_short}</span>
              </div>

              {issue.organization && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{isNp ? 'संस्था' : 'Organization'}:</span> {issue.organization}
                </p>
              )}

              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                {issue.description}
              </p>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {isNp ? 'अद्यावधिकहरू' : 'Updates'}
                </h4>
                {issue.events.length > 0 ? (
                  <div className="space-y-2">
                    {issue.events.map(event => (
                      <div key={event.id} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700">{event.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{event.bs_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">{isNp ? 'कुनै अद्यावधिक छैन' : 'No updates yet'}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
