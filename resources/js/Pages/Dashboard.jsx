import { Head, Link } from '@inertiajs/react';
import { route } from '../ziggy';
import StatsCard from '../Components/StatsCard';
import { StatusBadge, PriorityBadge } from '../Components/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard({ organizations, stats, recent_issues, category_stats, issues_over_time }) {
    return (
        <>
            <Head title="Nagarik Sarokar - Nepal's Complaint Management System" />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs font-medium text-blue-200">Nepal's Complaint Management Platform</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
                            <span className="block">Nagarik Sarokar</span>
                            <span className="block text-lg sm:text-xl font-normal text-blue-200 mt-2">नागरिक सरोकार</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-blue-200/80 max-w-2xl mx-auto mb-8">
                            A transparent, efficient, and accessible platform for citizens to report issues
                            and track their resolution in real-time.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href={route('issues.create')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Submit an Issue
                            </Link>
                            <Link href={route('status.check')} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                Track Status
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatsCard
                        label="Total Issues"
                        value={stats.total_issues}
                        icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        color="indigo"
                    />
                    <StatsCard
                        label="Open Issues"
                        value={stats.open_issues}
                        icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        color="amber"
                    />
                    <StatsCard
                        label="Resolved Today"
                        value={stats.resolved_today}
                        icon="M5 13l4 4L19 7"
                        color="green"
                    />
                    <StatsCard
                        label="Avg Resolution"
                        value={stats.avg_resolution_time || 'N/A'}
                        icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        color="purple"
                    />
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Registered Organizations</h2>
                        <p className="text-sm text-gray-500">Browse organizations and their current issue status</p>
                    </div>
                    <Link href={route('register')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        Register your organization &rarr;
                    </Link>
                </div>

                {organizations.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200/60 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No organizations registered yet</h3>
                        <p className="text-gray-500 text-sm">Organizations will appear here once they register on the platform.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {organizations.map(org => {
                            const issueCount = org.issues_count || 0;
                            const color = issueCount === 0 ? 'green' : issueCount > 5 ? 'red' : 'amber';
                            const colors = {
                                green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                                amber: 'bg-amber-50 border-amber-200 text-amber-700',
                                red: 'bg-red-50 border-red-200 text-red-700',
                            };
                            const badges = {
                                educational: 'bg-blue-50 text-blue-700',
                                municipality: 'bg-purple-50 text-purple-700',
                                government: 'bg-indigo-50 text-indigo-700',
                                hospital: 'bg-rose-50 text-rose-700',
                            };

                            return (
                                <Link
                                    key={org.id}
                                    href={route('org.dashboard', org.slug)}
                                    className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-md hover:border-gray-300 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                {org.name}
                                            </h3>
                                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${badges[org.type] || 'bg-gray-50 text-gray-600'}`}>
                                                {org.type}
                                            </span>
                                        </div>
                                        <div className={`text-center px-3 py-1.5 rounded-lg border text-sm font-bold ${colors[color]}`}>
                                            {issueCount}
                                        </div>
                                    </div>
                                    {org.address && (
                                        <p className="text-xs text-gray-400 truncate">{org.address}</p>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Charts Row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Distribution */}
                    <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Issues by Category</h3>
                        {category_stats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={category_stats} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={140} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        formatter={(value, name) => [value, 'Issues']}
                                    />
                                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                                        {category_stats.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                                No data available yet
                            </div>
                        )}
                    </div>

                    {/* Issue Trends */}
                    <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">7-Day Trend</h3>
                        {issues_over_time.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={issues_over_time}>
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        labelFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                                No data available yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Issues */}
            {recent_issues.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Issues</h2>
                    <div className="space-y-3">
                        {recent_issues.map(issue => (
                            <div key={issue.id} className="bg-white rounded-xl border border-gray-200/60 p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-gray-900">{issue.reference_code}</span>
                                            <StatusBadge status={issue.status} />
                                            <PriorityBadge priority={issue.priority} />
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-1">{issue.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {issue.category} &middot; {issue.organization || issue.location}
                                            &middot; {new Date(issue.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
