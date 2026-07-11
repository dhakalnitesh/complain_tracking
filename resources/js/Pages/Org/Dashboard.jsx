import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import StatsCard from '../../Components/UI/StatsCard';
import { StatusBadge, PriorityBadge } from '../../Components/UI/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6'];

export default function OrgDashboard({ organization, locations, stats, recent_issues, category_stats, priority_stats }) {
    const user = usePage().props.auth.user;

    return (
        <>
            <Head title={`${organization.name} - Dashboard`} />

            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">{organization.name.charAt(0)}</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
                                <p className="text-blue-200/80 text-sm">{organization.address || organization.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {user?.is_staff && (
                                <Link href={route('staff.issues.index')}
                                    className="px-4 py-2 text-sm font-medium text-indigo-900 bg-white rounded-lg hover:bg-blue-50 transition-all shadow-sm">
                                    My Issues
                                </Link>
                            )}
                            <Link href={route('issues.create')}
                                className="px-4 py-2 text-sm font-medium text-white bg-white/20 rounded-lg hover:bg-white/30 transition-all border border-white/20">
                                Submit Issue
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatsCard label="Total Issues" value={stats.total_issues} icon="M9 12l2 2 4-4" color="indigo" />
                    <StatsCard label="Open" value={stats.open_issues} icon="M12 8v4l3 3" color="amber" />
                    <StatsCard label="Resolved Today" value={stats.resolved_today} icon="M5 13l4 4L19 7" color="green" />
                    <StatsCard label="Escalated" value={stats.escalated} icon="M12 9v2m0 4h.01" color="red" />
                </div>
            </div>

            {/* Charts */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Issues by Category</h3>
                        {category_stats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={category_stats} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={140} />
                                    <Tooltip />
                                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                        {category_stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data</div>}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Priority Distribution</h3>
                        {priority_stats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={priority_stats} dataKey="total" nameKey="priority" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        {priority_stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data</div>}
                    </div>
                </div>

                {/* Location tiles */}
                <div className="bg-white rounded-xl border border-gray-200/60 p-6 mb-8">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Locations</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {locations.map(loc => {
                            const count = loc.issues_count || 0;
                            const color = count === 0 ? 'bg-green-50 border-green-200 text-green-700' : count > 3 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700';
                            return (
                                <div key={loc.id} className={`rounded-lg border p-3 text-center ${color}`}>
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-xs font-medium truncate">{loc.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Issues */}
                <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Issues</h3>
                    <div className="space-y-3">
                        {recent_issues.map(issue => (
                            <Link key={issue.id} href={route('issues.show-reference', issue.reference_code)}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-mono text-xs font-bold text-gray-900">{issue.reference_code}</span>
                                        <StatusBadge status={issue.status} />
                                        <PriorityBadge priority={issue.priority} />
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-1">{issue.description}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{issue.category} &middot; {issue.bs_created_at}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                        {recent_issues.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-8">No issues reported yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
