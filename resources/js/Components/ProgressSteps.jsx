import { useLanguage } from '../Context/LanguageContext';

const steps = [
  { key: 'received', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'in_progress', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'resolved', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function ProgressSteps({ currentStatus, events = [] }) {
  const { t } = useLanguage();
  const currentIdx = steps.findIndex(s => s.key === currentStatus);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, idx) => {
          const isComplete = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                isComplete
                  ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                </svg>
              </div>
              <span className={`text-xs font-medium mt-1.5 text-center ${
                isComplete ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {t(`statuses.${step.key}`)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mt-[-2.5rem]">
        <div className="absolute top-5 left-[calc(16.66%+1.25rem)] right-[calc(16.66%+1.25rem)] h-0.5 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700"
            style={{ width: `${Math.max(0, currentIdx) * 50}%` }}
          />
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t('status.timeline')}
          </p>
          {events.slice(0, 5).map((event, idx) => (
            <div key={event.id || idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  idx === 0 ? 'bg-indigo-500' : 'bg-gray-300'
                }`} />
                {idx < Math.min(events.length - 1, 4) && (
                  <div className="w-px flex-1 bg-gray-200" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-700">{event.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {event.bs_created_at}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
