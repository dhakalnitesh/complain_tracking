import { useLanguage } from '../../Context/LanguageContext';

const statusIcons = {
  received: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  in_progress: 'M13 10V3L4 14h7v7l9-11h-7z',
  resolved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

const statusLabels = {
  received: 'statuses.received',
  in_progress: 'statuses.in_progress',
  resolved: 'statuses.resolved',
};

export default function ProgressSteps({ currentStatus, events = [] }) {
  const { t } = useLanguage();

  const statusOrder = ['received', 'in_progress', 'resolved'];
  const currentIdx = statusOrder.indexOf(currentStatus);

  const statusEvents = events.filter(e =>
    statusOrder.includes(e.type) || e.type === 'assigned' || e.type === 'resolved'
  );

  const allEntries = [];
  statusOrder.forEach((status, idx) => {
    const isReached = idx <= currentIdx;
    if (isReached) {
      const matchEvent = statusEvents.find(e => e.type === status || (status === 'resolved' && e.type === 'resolved'));
      allEntries.push({
        type: 'status',
        key: status,
        label: t(statusLabels[status]),
        icon: statusIcons[status],
        isActive: idx === currentIdx,
        isPast: idx < currentIdx,
        timestamp: matchEvent?.bs_created_at || null,
        description: matchEvent?.description || null,
      });
    }
  });

  const otherEvents = events
    .filter(e => !statusOrder.includes(e.type) && e.type !== 'resolved')
    .slice(0, 10);

  const merged = [...allEntries, ...otherEvents.map(e => ({
    type: 'event',
    key: `event-${e.id}`,
    description: e.description,
    timestamp: e.bs_created_at,
    isPublic: e.is_public,
  }))];

  if (merged.length === 0) {
    return (
      <div className="text-center py-6">
        <svg className="w-10 h-10 mx-auto text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-400">{t('status.no_updates') || 'No updates yet'}</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-4">
        {merged.map((entry, idx) => (
          <li key={entry.key} className="relative pb-4">
            {idx < merged.length - 1 && (
              <div className="absolute left-[11px] top-5 bottom-0 w-px bg-gray-200" aria-hidden="true" />
            )}
            <div className="flex gap-3">
              <div className="relative flex-shrink-0">
                {entry.type === 'status' ? (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    entry.isActive
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-100'
                      : entry.isPast
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={entry.icon} />
                    </svg>
                  </div>
                ) : (
                  <div className="w-[11px] h-[11px] rounded-full mt-1.5 ml-[7px] bg-indigo-200" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                {entry.type === 'status' ? (
                  <div>
                    <p className={`text-sm font-semibold ${entry.isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {entry.label}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                    )}
                    {entry.timestamp && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{entry.timestamp}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700">{entry.description}</p>
                    {entry.timestamp && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{entry.timestamp}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
