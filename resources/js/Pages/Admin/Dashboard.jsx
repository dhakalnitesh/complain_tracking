import { Head, Link, router } from '@inertiajs/react';
import { route } from '../../ziggy';
import StatsCard from '../../Components/StatsCard';
import { StatusBadge, PriorityBadge } from '../../Components/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import useRealtime from '../../hooks/useRealtime';

const COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AdminDashboard({ stats, recent_issues, category_stats, issues_over_time, avg_resolution_hours }) {
    useRealtime();

    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500">Super admin overview &amp; management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.issues.index')} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                            All Issues
                        </Link>
                        <Link href={route('admin.organizations')} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                            Organizations
                        </Link>
                        <Link href={route('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            View Site
                        </Link>
                    </div>
                </div>

                {/* Stats Cards — Clickable */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatsCard
                        label="Total"
                        value={stats.total_issues}
                        icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        color="indigo"
                        href={route('admin.issues.index')}
                    />
                    <StatsCard
                        label="Open"
                        value={stats.open_issues}
                        icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        color="amber"
                        href={`${route('admin.issues.index')}?status=received`}
                    />
                    <StatsCard
                        label="Resolved"
                        value={stats.resolved_issues}
                        icon="M5 13l4 4L19 7"
                        color="green"
                        href={`${route('admin.issues.index')}?status=resolved`}
                    />
                    <StatsCard
                        label="Escalated"
                        value={stats.escalated_issues}
                        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        color="red"
                        href={route('admin.issues.index')}
                    />
                    <StatsCard
                        label="Organizations"
                        value={stats.total_organizations}
                        icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        color="purple"
                        href={route('admin.organizations')}
                    />
                    <StatsCard
                        label="Avg Resolution"
                        value={avg_resolution_hours ? `${avg_resolution_hours}h` : 'N/A'}
                        icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        color="blue"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Issues by Category</h3>
                        {category_stats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={category_stats} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={150} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                        {category_stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No data</div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">14-Day Trend</h3>
                        {issues_over_time.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={issues_over_time}>
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No data</div>
                        )}
                    </div>
                </div>

                {/* Recent Issues — 5 items, no filters */}
                <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
                            <p className="text-sm text-gray-500">Latest 5 complaints</p>
                        </div>
                        <Link href={route('admin.issues.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                            View All &rarr;
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recent_issues.map(issue => (
                            <div key={issue.id} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Link href={route('admin.issues.show', issue.id)} className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                            {issue.reference_code}
                                        </Link>
                                        <StatusBadge status={issue.status} />
                                        <PriorityBadge priority={issue.priority} />
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-1">{issue.description}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {issue.organization || issue.location} &middot; {new Date(issue.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {recent_issues.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">No issues yet</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
