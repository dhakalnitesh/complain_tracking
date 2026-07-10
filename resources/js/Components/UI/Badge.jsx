import { useLanguage } from '../../Context/LanguageContext';

const statusConfig = {
    received: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
};

const priorityConfig = {
    low: { bg: 'bg-gray-50', text: 'text-gray-600' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700' },
    critical: { bg: 'bg-red-50', text: 'text-red-700' },
};

export function StatusBadge({ status }) {
    const { t } = useLanguage();
    const cfg = statusConfig[status] || statusConfig.received;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {t(`statuses.${status}`)}
        </span>
    );
}

export function PriorityBadge({ priority }) {
    const { t } = useLanguage();
    const cfg = priorityConfig[priority] || priorityConfig.medium;
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {t(`priorities.${priority}`)}
        </span>
    );
}
