import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { StatusBadge, PriorityBadge } from '../../../Components/UI/Badge';
import useRealtime from '../../../hooks/useRealtime';
import { useState } from 'react';

export default function StaffIssues({ issues, filters = {} }) {
    const user = usePage().props.auth.user;
    useRealtime(['issues']);
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [search, setSearch] = useState(filters.search || '');

    function buildParams(overrides = {}) {
        const params = {
            status: overrides.status !== undefined ? overrides.status : (statusFilter !== 'all' ? statusFilter : ''),
            priority: overrides.priority !== undefined ? overrides.priority : (priorityFilter !== 'all' ? priorityFilter : ''),
            search: overrides.search !== undefined ? overrides.search : search,
        };
        const clean = {};
        Object.entries(params).forEach(([k, v]) => { if (v) clean[k] = v; });
        return clean;
    }

    function applyFilters() {
        router.get(route('staff.issues.index'), buildParams(), { preserveState: true, replace: true, preserveScroll: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilters();
    }

    function clearFilters() {
        setStatusFilter('all');
        setPriorityFilter('all');
        setSearch('');
        router.get(route('staff.issues.index'), {}, { preserveState: true, replace: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="My Issues - Staff" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Assigned Issues</h1>
                        <p className="text-sm text-gray-500 mt-1">{issues.total} issue{issues.total !== 1 ? 's' : ''} assigned to you</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {user?.organization ? (
                            <Link href={route('org.dashboard', user.organization.slug)} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                                {user.organization.name}
                            </Link>
                        ) : (
                            <Link href={route('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                Site
                            </Link>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search reference or description..."
                                className="flex-1 rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            <button type="submit" className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
                                Search
                            </button>
                        </form>
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setTimeout(applyFilters, 0); }}
                            className="rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="received">Received</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={e => { setPriorityFilter(e.target.value); setTimeout(applyFilters, 0); }}
                            className="rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <button type="button" onClick={clearFilters}
                            className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Clear
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {issues.data.map(issue => {
                        const deadline = issue.extension_deadline_at || issue.deadline_at;
                        const deadlineDate = deadline ? new Date(deadline) : null;
                        const isOverdue = deadlineDate && deadlineDate < new Date() && issue.status !== 'resolved';

                        return (
                            <Link key={issue.id} href={route('staff.issues.show', issue.id)}
                                className={`block rounded-xl border p-4 transition-all hover:shadow-sm ${
                                    isOverdue ? 'border-red-300 bg-red-50/50' : 'border-gray-200/60 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-mono text-sm font-bold text-indigo-600">{issue.reference_code}</span>
                                            <StatusBadge status={issue.status} />
                                            <PriorityBadge priority={issue.priority} />
                                            {isOverdue && (
                                                <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Overdue</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">{issue.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                            <span>{issue.category}</span>
                                            <span>&middot;</span>
                                            <span>{issue.organization || issue.location}</span>
                                            <span>&middot;</span>
                                            <span>{issue.bs_created_at}</span>
                                            {deadlineDate && (
                                                <>
                                                    <span>&middot;</span>
                                                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                                        Deadline: {deadlineDate.toLocaleDateString('en-GB')}
                                                        {isOverdue && ' (Overdue)'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{issue.description}</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        );
                    })}

                    {issues.data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <p className="text-sm">No issues assigned to you yet.</p>
                        </div>
                    )}
                </div>

                {issues.links?.length > 0 && issues.total > issues.per_page && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {issues.links.map((link, i) => (
                            <button key={i}
                                onClick={() => { if (link.url && !link.active) { router.get(link.url, {}, { preserveState: true, replace: true, preserveScroll: true }); } }}
                                disabled={!link.url}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    link.active ? 'bg-indigo-600 text-white' : link.url ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label.replace(/</g, '&lt;').replace(/>/g, '&gt;') }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
