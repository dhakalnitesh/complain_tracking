import { Head, Link, usePage, router } from '@inertiajs/react';

export default function SpamLogs() {
  const { logs, event_types } = usePage().props;

  function filterBy(type) {
    router.get(route('admin.spam-logs'), { event_type: type }, { preserveState: true });
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <Head title="Spam Logs" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Spam Audit Logs</h1>
        <Link href={route('admin.moderation')} className="text-indigo-600 hover:underline text-sm">Back to Moderation</Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => router.get(route('admin.spam-logs'), {}, { preserveState: true })} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">All</button>
        {event_types.map(type => (
          <button key={type} onClick={() => filterBy(type)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">{type}</button>
        ))}
      </div>

      {logs.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No logs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">UUID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.data.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{log.event_type}</span>
                    {log.metadata?.reasons && (
                      <p className="text-xs text-gray-400 mt-0.5">{log.metadata.reasons.join(', ')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.uuid ?? '-'}</td>
                  <td className="px-4 py-3">
                    {log.spam_score !== null ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.spam_score > 0.7 ? 'bg-red-100 text-red-700' :
                        log.spam_score > 0.3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{log.spam_score}</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.links && (
        <div className="mt-6 flex justify-center gap-2" dangerouslySetInnerHTML={{ __html: logs.links }} />
      )}
    </div>
  );
}
