import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import SearchSelect from '../../../Components/UI/SearchSelect';
import useRealtime from '../../../hooks/useRealtime';
import { useState } from 'react';
import CreateModal from './CreateModal';
import EditModal from './EditModal';

const identityLabels = {
    citizenship: 'नागरिकता (Citizenship)',
    passport: 'पासपोर्ट (Passport)',
    voter_id: 'मतदाता परिचय पत्र (Voter ID)',
};

export default function StaffIndex({ staff, organizations, filters = {} }) {
    useRealtime(['staff', 'organizations']);
    const [search, setSearch] = useState(filters.search || '');
    const [orgFilter, setOrgFilter] = useState(filters.organization_id || 'all');
    const [perPage, setPerPage] = useState(filters.per_page || '25');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    function buildParams(overrides = {}) {
        const params = {
            search: overrides.search !== undefined ? overrides.search : search,
            organization_id: overrides.organization_id !== undefined ? overrides.organization_id : (orgFilter !== 'all' ? orgFilter : ''),
            per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
        };
        const clean = {};
        Object.entries(params).forEach(([k, v]) => { if (v) clean[k] = v; });
        return clean;
    }

    function applyFilters() {
        router.get(route('admin.staff'), buildParams(), { preserveState: true, replace: true, preserveScroll: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        applyFilters();
    }

    function clearFilters() {
        setSearch('');
        setOrgFilter('all');
        setPerPage('25');
        router.get(route('admin.staff'), {}, { preserveState: true, replace: true, preserveScroll: true });
    }

    function handleDelete(userId) {
        if (confirm('Are you sure you want to remove this staff member?')) {
            router.delete(route('admin.staff.destroy', userId), { preserveScroll: true });
        }
    }

    function openCreate() {
        setEditingUser(null);
        setModalOpen(true);
    }

    function openEdit(user) {
        setEditingUser(user);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingUser(null);
    }

    return (
        <>
            <Head title="Manage Staff" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Nav */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.dashboard')} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all">
                            <i className="fas fa-arrow-left text-xs"></i> Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 ml-2">Staff Members</h1>
                    </div>
                    <button onClick={openCreate}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 shadow-sm transition-all">
                        <i className="fas fa-plus mr-1.5"></i> Add Staff
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200/60 p-4 mb-6">
                    <div className="flex items-end gap-3">
                        <div className="w-24 shrink-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Per page</label>
                            <select
                                value={perPage}
                                onChange={e => { setPerPage(e.target.value); setTimeout(applyFilters, 0); }}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                        <div className="flex-1" style={{ width: '55%', maxWidth: '55%' }}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                            <form onSubmit={handleSearch} className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search name or email..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border-gray-300 border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <button type="submit"
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm">
                                    <i className="fas fa-search mr-1"></i> Search
                                </button>
                            </form>
                        </div>
                        <div className="w-56 shrink-0">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Organization</label>
                            <SearchSelect
                                options={[
                                    { value: 'all', label: 'All Organizations' },
                                    ...organizations.map(o => ({ value: String(o.id), label: o.name })),
                                ]}
                                value={orgFilter}
                                onChange={v => { setOrgFilter(v); setTimeout(applyFilters, 0); }}
                                placeholder="Organization"
                            />
                        </div>
                        <div className="shrink-0">
                            <button type="button" onClick={clearFilters}
                                className="px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Organization</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Identity</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Phone</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Issues</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staff.data && staff.data.length > 0 ? (
                                    staff.data.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50">
                                            <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                                            <td className="py-3 px-4 text-gray-500">{user.email}</td>
                                            <td className="py-3 px-4 text-gray-600">{user.organization_name || '-'}</td>
                                            <td className="py-3 px-4">
                                                <div className="text-xs">
                                                    <span className="text-gray-500">{identityLabels[user.identity_type] || user.identity_type}</span>
                                                    {user.identity_number && (
                                                        <span className="block text-gray-700 font-medium">{user.identity_number}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{user.phone || '-'}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Link href={route('admin.staff.issues', user.id)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium">
                                                    {user.issues_count}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEdit(user)}
                                                        className="w-8 h-8 flex items-center justify-center text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                                        title="Edit staff member">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <Link href={route('admin.staff.issues', user.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                        title="View assigned issues">
                                                        <i className="fas fa-list"></i>
                                                    </Link>
                                                    <button onClick={() => handleDelete(user.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                        title="Remove staff member">
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400">
                                            <i className="fas fa-users text-4xl text-gray-300 mb-3 block"></i>
                                            <p className="text-sm">No staff members found.</p>
                                            <p className="text-xs mt-1">{search || orgFilter !== 'all' ? 'Try adjusting your filters.' : 'Add one to assign complaints to specific people.'}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {staff.links && staff.links.length > 3 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-500">
                            Showing {staff.from ?? 0}–{staff.to ?? 0} of {staff.total ?? 0}
                        </p>
                        <div className="flex items-center gap-2">
                            {staff.links.map((link, i) => (
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
                    </div>
                )}
            </div>

            <CreateModal show={modalOpen && !editingUser} onClose={closeModal} organizations={organizations} />
            <EditModal show={modalOpen && !!editingUser} onClose={closeModal} user={editingUser} organizations={organizations} />
        </>
    );
}
