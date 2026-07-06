export default function StatsCard({ label, value, subtext, icon, color = 'indigo' }) {
    const colors = {
        indigo: 'from-indigo-500 to-blue-600',
        green: 'from-emerald-500 to-teal-600',
        red: 'from-red-500 to-rose-600',
        amber: 'from-amber-500 to-orange-600',
        blue: 'from-blue-500 to-cyan-600',
        purple: 'from-purple-500 to-violet-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
                </div>
                {icon && (
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color] || colors.indigo} flex items-center justify-center shadow-sm`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
