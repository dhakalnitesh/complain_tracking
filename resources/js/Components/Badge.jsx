const statusConfig = {
    received: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Received' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400', label: 'In Progress' },
    resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Resolved' },
};

const priorityConfig = {
    low: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Low' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Medium' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'High' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', label: 'Critical' },
};

export function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.received;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export function PriorityBadge({ priority }) {
    const cfg = priorityConfig[priority] || priorityConfig.medium;
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
}
