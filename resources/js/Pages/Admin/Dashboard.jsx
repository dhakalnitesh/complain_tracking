import { Head, Link, router } from '@inertiajs/react';
import { route } from '../../ziggy';
import StatsCard from '../../Components/StatsCard';
import { StatusBadge, PriorityBadge } from '../../Components/Badge';
import SearchSelect from '../../Components/SearchSelect';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useState } from 'react';

const COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const statusOptions = ['received', 'in_progress', 'resolved'];

function getNextStatus(current) {
    const idx = statusOptions.indexOf(current);
    return idx < statusOptions.length - 1 ? statusOptions[idx + 1] : null;
}

export default function AdminDashboard({ stats, issues, category_stats, org_stats, issues_over_time, avg_resolution_hours, staff_users = [] }) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [assigning, setAssigning] = useState(null);

    const filteredIssues = issues.filter(issue => {
        if (filter !== 'all' && issue.status !== filter) return false;
        if (search && !issue.reference_code.toLowerCase().includes(search.toLowerCase()) &&
            !issue.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    function handleStatusChange(issueId, newStatus) {
        router.patch(route('admin.issues.update-status', issueId), { status: newStatus });
    }

    function handleAssign(issueId, staffId, staffName) {
        router.post(route('admin.issues.assign', issueId), {
            assigned_to: staffName,
            assigned_user_id: staffId || null,
        });
        setAssigning(null);
    }

    function currentOrgStaff(issue) {
        return staff_users.filter(s => s.organization_id === issue.organization_id || !s.organization_id);
    }

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
                        <Link href={route('admin.organizations')} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                            Organizations
                        </Link>
                        <Link href={route('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            View Site
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatsCard label="Total" value={stats.total_issues} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" color="indigo" />
                    <StatsCard label="Open" value={stats.open_issues} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="amber" />
                    <StatsCard label="Resolved" value={stats.resolved_issues} icon="M5 13l4 4L19 7" color="green" />
                    <StatsCard label="Escalated" value={stats.escalated_issues} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" color="red" />
                    <StatsCard label="Organizations" value={stats.total_organizations} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" color="purple" />
                    <StatsCard label="Avg Resolution" value={avg_resolution_hours ? `${avg_resolution_hours}h` : 'N/A'} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="blue" />
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

                {/* Issues List */}
                <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">All Issues</h3>
                            <p className="text-sm text-gray-500">{filteredIssues.length} issues</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search issues..."
                                className="flex-1 sm:w-48 rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            <div className="w-36">
                                <SearchSelect
                                    options={[
                                        { value: 'all', label: 'All Status' },
                                        { value: 'received', label: 'Received' },
                                        { value: 'in_progress', label: 'In Progress' },
                                        { value: 'resolved', label: 'Resolved' },
                                    ]}
                                    value={filter}
                                    onChange={v => setFilter(v)}
                                    placeholder="Filter"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredIssues.map(issue => (
                            <div
                                key={issue.id}
                                className={`rounded-xl border p-4 transition-all ${
                                    issue.is_sla_breached
                                        ? 'border-red-300 bg-red-50/50'
                                        : issue.is_escalated
                                        ? 'border-orange-200 bg-orange-50/30'
                                        : 'border-gray-200/60 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-mono text-sm font-bold text-gray-900">{issue.reference_code}</span>
                                            {issue.is_sla_breached && (
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                    SLA Breached
                                                </span>
                                            )}
                                            {issue.is_escalated && !issue.is_sla_breached && (
                                                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                    Escalated
                                                </span>
                                            )}
                                            <StatusBadge status={issue.status} />
                                            <PriorityBadge priority={issue.priority} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
                                            <span>{issue.category}</span>
                                            <span>&middot;</span>
                                            <span>{issue.organization || issue.location}</span>
                                            <span>&middot;</span>
                                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                            {issue.rating && (
                                                <>
                                                    <span>&middot;</span>
                                                    <span className="text-amber-600">Rating: {issue.rating}/5</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-2">{issue.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        {issue.status !== 'resolved' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const next = getNextStatus(issue.status);
                                                        if (next) handleStatusChange(issue.id, next);
                                                    }}
                                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                                                >
                                                    {issue.status === 'received' ? 'Start Progress' : 'Resolve'}
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setAssigning(assigning === issue.id ? null : issue.id)}
                                                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                                                    >
                                                        {issue.assigned_to || 'Assign'}
                                                    </button>
                                                    {assigning === issue.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-48 overflow-y-auto">
                                                            <button
                                                                onClick={() => handleAssign(issue.id, null, '')}
                                                                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                                                            >
                                                                Unassign
                                                            </button>
                                                            {currentOrgStaff(issue).map(s => (
                                                                <button
                                                                    key={s.id}
                                                                    onClick={() => handleAssign(issue.id, s.id, s.name)}
                                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                                                                        issue.assigned_user_id === s.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                                                    }`}
                                                                >
                                                                    {s.name}
                                                                </button>
                                                            ))}
                                                            {currentOrgStaff(issue).length === 0 && (
                                                                <div className="px-3 py-2 text-xs text-gray-400">No staff available</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {issue.status === 'resolved' && (
                                            <button
                                                onClick={() => handleStatusChange(issue.id, 'received')}
                                                className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                                            >
                                                Reopen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredIssues.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No issues found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
