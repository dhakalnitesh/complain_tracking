import { Head, Link, router } from '@inertiajs/react';
import { route } from '../../../ziggy';
import { StatusBadge, PriorityBadge } from '../../../Components/UI/Badge';
import SearchSelect from '../../../Components/UI/SearchSelect';
import NepaliDatePicker from '../../../Components/UI/NepaliDatePicker';
import { useState } from 'react';

const statusOptions = ['received', 'in_progress', 'resolved'];

function getNextStatus(current) {
    const idx = statusOptions.indexOf(current);
    return idx < statusOptions.length - 1 ? statusOptions[idx + 1] : null;
}

export default function AdminIssues({ issues, staff_users = [], organizations = [], categories = [], filters = {} }) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [orgFilter, setOrgFilter] = useState(filters.organization_id || 'all');
    const [staffFilter, setStaffFilter] = useState(filters.assigned_user_id || 'all');
    const [search, setSearch] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    function buildParams(overrides = {}) {
        return {
            status: overrides.status !== undefined ? overrides.status : (statusFilter !== 'all' ? statusFilter : ''),
            priority: overrides.priority !== undefined ? overrides.priority : (priorityFilter !== 'all' ? priorityFilter : ''),
            organization_id: overrides.organization_id !== undefined ? overrides.organization_id : (orgFilter !== 'all' ? orgFilter : ''),
            assigned_user_id: overrides.assigned_user_id !== undefined ? overrides.assigned_user_id : (staffFilter !== 'all' ? staffFilter : ''),
            search: overrides.search !== undefined ? overrides.search : search,
            date_from: overrides.date_from !== undefined ? overrides.date_from : (dateFrom || ''),
            date_to: overrides.date_to !== undefined ? overrides.date_to : (dateTo || ''),
        };
    }

    function applyFilters() {
        const params = buildParams();
        const clean = {};
        Object.entries(params).forEach(([k, v]) => { if (v) clean[k] = v; });
        router.get(route('admin.issues.index'), clean, { preserveState: true, replace: true, preserveScroll: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilters();
    }

    function clearFilters() {
        setStatusFilter('all');
        setPriorityFilter('all');
        setOrgFilter('all');
        setStaffFilter('all');
        setSearch('');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.issues.index'), {}, { preserveState: true, replace: true, preserveScroll: true });
    }

    function exportCsv() {
        const params = buildParams();
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
        window.open(`${route('admin.issues.export-csv')}?${qs.toString()}`, '_blank');
    }

    function handleStatusUpdate(issueId, newStatus) {
        router.patch(route('admin.issues.update-status', issueId), { status: newStatus }, { preserveScroll: true });
    }

    function handleAssign(issueId, staffId, staffName) {
        router.post(route('admin.issues.assign', issueId), {
            assigned_to: staffName,
            assigned_user_id: staffId || null,
        }, { preserveScroll: true });
    }

    function currentOrgStaff(issue) {
        return staff_users.filter(s => s.organization_id === issue.organization_id || !s.organization_id);
    }

    const [assigning, setAssigning] = useState(null);

    return (
        <>
            <Head title="Issues - Admin" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Nav */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.dashboard')} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
                            Dashboard
                        </Link>
                        <Link href={route('admin.staff')} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                            Staff
                        </Link>
                        <Link href={route('admin.organizations')} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                            Orgs
                        </Link>
                        <Link href={route('admin.moderation')} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                            Moderation
                        </Link>
                        <Link href={route('dashboard')} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                            Site
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500">{issues.total} issues</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200/60 p-4 mb-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by reference or description..."
                                    className="flex-1 sm:w-64 rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                                <button type="submit" className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
                                    Search
                                </button>
                            </form>
                            <div className="w-36">
                                <SearchSelect
                                    options={[
                                        { value: 'all', label: 'All Status' },
                                        { value: 'received', label: 'Received' },
                                        { value: 'in_progress', label: 'In Progress' },
                                        { value: 'resolved', label: 'Resolved' },
                                    ]}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    placeholder="Status"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-32">
                                <SearchSelect
                                    options={[
                                        { value: 'all', label: 'All Priority' },
                                        { value: 'low', label: 'Low' },
                                        { value: 'medium', label: 'Medium' },
                                        { value: 'high', label: 'High' },
                                        { value: 'critical', label: 'Critical' },
                                    ]}
                                    value={priorityFilter}
                                    onChange={setPriorityFilter}
                                    placeholder="Priority"
                                />
                            </div>
                            <div className="w-40">
                                <SearchSelect
                                    options={[
                                        { value: 'all', label: 'All Organizations' },
                                        ...organizations.map(o => ({ value: String(o.id), label: o.name })),
                                    ]}
                                    value={orgFilter}
                                    onChange={setOrgFilter}
                                    placeholder="Organization"
                                />
                            </div>
                            <div className="w-40">
                                <SearchSelect
                                    options={[
                                        { value: 'all', label: 'All Staff' },
                                        ...staff_users.map(s => ({ value: String(s.id), label: s.name })),
                                    ]}
                                    value={staffFilter}
                                    onChange={setStaffFilter}
                                    placeholder="Assigned Staff"
                                />
                            </div>
                            <div className="w-36">
                                <NepaliDatePicker
                                    value={dateFrom}
                                    onChange={setDateFrom}
                                    placeholder="Date from (BS)"
                                />
                            </div>
                            <div className="w-36">
                                <NepaliDatePicker
                                    value={dateTo}
                                    onChange={setDateTo}
                                    placeholder="Date to (BS)"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={applyFilters}
                                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
                            >
                                Export CSV
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Issues List */}
                <div className="space-y-3">
                    {issues.data.map(issue => (
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
                                        <Link href={route('admin.issues.show', issue.id)} className="font-mono text-sm font-bold text-indigo-600 hover:text-indigo-800">
                                            {issue.reference_code}
                                        </Link>
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
                                        <span>{issue.bs_created_at}</span>
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
                                                    if (next) handleStatusUpdate(issue.id, next);
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
                                            onClick={() => handleStatusUpdate(issue.id, 'received')}
                                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                                        >
                                            Reopen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {issues.data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm">No issues found</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {issues.links && issues.links.length > 3 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {issues.links.map((link, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (link.url && !link.active) {
                                        router.get(link.url, {}, { preserveState: true, replace: true, preserveScroll: true });
                                    }
                                }}
                                disabled={!link.url}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                        ? 'text-gray-600 hover:bg-gray-100'
                                        : 'text-gray-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
