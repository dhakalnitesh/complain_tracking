import { Head, Link, router } from '@inertiajs/react';
import { useLanguage } from '../../../Context/LanguageContext';

export default function Moderation({ flags }) {
  const { t, lang } = useLanguage();

  const handleDismiss = (flagId) => {
    router.post(route('admin.moderation.dismiss', flagId));
  };

  const handleHide = (flagId) => {
    router.post(route('admin.moderation.hide', flagId));
  };

  const handleDelete = (flagId) => {
    if (confirm('Are you sure? This will permanently delete the content.')) {
      router.delete(route('admin.moderation.delete', flagId));
    }
  };

  const reasonBadge = (reason) => {
    const colors = {
      spam: 'bg-red-100 text-red-700',
      harassment: 'bg-orange-100 text-orange-700',
      inappropriate: 'bg-yellow-100 text-yellow-700',
      duplicate: 'bg-blue-100 text-blue-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[reason] || colors.other;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Head title="Moderation Queue" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review flagged content and take action
        </p>
      </div>

      {flags.data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No pending flags. Everything looks good!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.data.map((flag) => (
            <div key={flag.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reasonBadge(flag.reason)}`}>
                      {flag.reason}
                    </span>
                    <span className="text-xs text-gray-400">
                      {flag.created_at}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">{flag.flaggable_type.split('\\').pop()}:</span>{' '}
                    {flag.flaggable?.description || flag.flaggable?.body || 'Content unavailable'}
                  </p>

                  {flag.description && (
                    <p className="text-xs text-gray-500 italic mt-1">
                      Note: {flag.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDismiss(flag.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleHide(flag.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {flags.links?.length > 3 && (
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {flags.links.map((link, i) => (
                <button key={i} onClick={() => link.url && router.get(link.url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                  disabled={!link.url}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    link.active ? 'bg-indigo-600 text-white' : link.url ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                  }`}>{link.label.replace(/&laquo;/g, '\u00AB').replace(/&raquo;/g, '\u00BB')}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
