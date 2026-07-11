import { useState, useEffect } from 'react';

export default function UpvotersModal({ open, issueId, onClose }) {
  const [upvoters, setUpvoters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !issueId) return;
    setLoading(true);
    fetch(`/api/issues/${issueId}/upvoters`, { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then(data => {
        setUpvoters(data.data || data || []);
      })
      .catch(() => setUpvoters([]))
      .finally(() => setLoading(false));
  }, [open, issueId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'cm-fadeIn 150ms ease-out' }} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden"
        style={{ animation: 'cm-scaleIn 200ms ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-rose-600" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Reactions ({upvoters.length})
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : upvoters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400">No reactions yet.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {upvoters.map((u, i) => (
                <div key={u.id || i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(u.name || u.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.email || 'Anonymous'}</p>
                    {u.name && u.email && (
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cm-scaleIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
