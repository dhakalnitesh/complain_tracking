import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from '../../ziggy';
import SearchSelect from '../../Components/SearchSelect';
import { useState, useEffect } from 'react';

const identityLabels = {
    citizenship: 'नागरिकता (Citizenship)',
    passport: 'पासपोर्ट (Passport)',
    voter_id: 'मतदाता परिचय पत्र (Voter ID)',
};

const identityTypes = [
    { value: 'citizenship', label: 'नागरिकता (Citizenship)', needsBack: true },
    { value: 'passport', label: 'पासपोर्ट (Passport)', needsBack: false },
    { value: 'voter_id', label: 'मतदाता परिचय पत्र (Voter ID)', needsBack: false },
];

function StaffFormModal({ show, onClose, editingUser, organizations }) {
    const isEdit = !!editingUser;
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, put, processing, errors, setError, clearErrors, reset } = useForm({
        name: editingUser?.name || '',
        email: editingUser?.email || '',
        password: '',
        password_confirmation: '',
        organization_id: editingUser ? String(editingUser.organization_id || '') : '',
        identity_type: editingUser?.identity_type || '',
        identity_number: editingUser?.identity_number || '',
        identity_document_front: null,
        identity_document_back: null,
        phone: editingUser?.phone || '',
        address: editingUser?.address || '',
    });

    useEffect(() => {
        if (!show) {
            reset();
            setFrontPreview(null);
            setBackPreview(null);
        }
    }, [show]);

    const needsBack = identityTypes.find(t => t.value === data.identity_type)?.needsBack;

    function handleNameChange(value) {
        if (value.length > 0 && /^[0-9]/.test(value)) return;
        setData('name', value);
        if (!value || /^[a-zA-Z\u0900-\u097F]/.test(value)) clearErrors('name');
    }

    function handlePhoneChange(value) {
        const digits = value.replace(/\D/g, '');
        setData('phone', digits);
        clearErrors('phone');
    }

    function handleSubmit(e) {
        e.preventDefault();
        let hasError = false;
        if (data.name && !/^[a-zA-Z\u0900-\u097F]/.test(data.name)) {
            setError('name', 'Name must start with a letter');
            hasError = true;
        }
        if (data.phone && !/^\d*$/.test(data.phone)) {
            setError('phone', 'Phone must contain only digits');
            hasError = true;
        }
        if (hasError) return;
        if (isEdit) {
            post(route('admin.staff.update', editingUser.id), {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        } else {
            post(route('admin.staff.store'), {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        }
    }

    function handleFrontFile(e) {
        const file = e.target.files[0];
        if (file) {
            setData('identity_document_front', file);
            setFrontPreview(URL.createObjectURL(file));
        }
    }

    function handleBackFile(e) {
        const file = e.target.files[0];
        if (file) {
            setData('identity_document_back', file);
            setBackPreview(URL.createObjectURL(file));
        }
    }

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEdit ? `Edit: ${editingUser.name}` : 'Add Staff Member'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6" encType="multipart/form-data">
                    {/* Basic Info */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Basic Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" value={data.name} onChange={e => handleNameChange(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {isEdit ? 'New Password' : 'Password'} {isEdit && <span className="text-gray-400">(leave blank to keep current)</span>} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type={showConfirm ? 'text' : 'password'} value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Organization <span className="text-red-500">*</span></label>
                                <select value={data.organization_id} onChange={e => setData('organization_id', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">Select organization...</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                                {errors.organization_id && <p className="text-red-500 text-xs mt-1">{errors.organization_id}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Identity */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Identity Document</h2>
                        <p className="text-xs text-gray-400 mb-3">Staff identity verification document (citizenship, passport, or voter ID). Upload a clear scan or photo.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Document Type <span className="text-red-500">*</span></label>
                                <select value={data.identity_type} onChange={e => setData('identity_type', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">Select type...</option>
                                    {identityTypes.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                {errors.identity_type && <p className="text-red-500 text-xs mt-1">{errors.identity_type}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Document Number <span className="text-red-500">*</span></label>
                                <input type="text" value={data.identity_number} onChange={e => setData('identity_number', e.target.value)}
                                    placeholder="e.g. 23-01-12345678"
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.identity_number && <p className="text-red-500 text-xs mt-1">{errors.identity_number}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                                <input type="text" value={data.phone} onChange={e => handlePhoneChange(e.target.value)}
                                    placeholder="98XXXXXXXX"
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                <textarea value={data.address} onChange={e => setData('address', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Document Front <span className="text-gray-400">(image or PDF)</span> <span className="text-red-500">*</span>
                                </label>
                                {isEdit && editingUser.identity_document_front_url && !frontPreview && (
                                    <div className="mb-2">
                                        <a href={editingUser.identity_document_front_url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 underline">View current document</a>
                                    </div>
                                )}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('modal-front-upload').click()}>
                                    {frontPreview ? (
                                        <div className="relative">
                                            {data.identity_document_front?.type?.startsWith('image/') ? (
                                                <img src={frontPreview} alt="Front" className="max-h-32 mx-auto rounded" />
                                            ) : (
                                                <p className="text-sm text-indigo-600">{data.identity_document_front?.name}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">Click to change</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="text-xs text-gray-400 mt-1">Click to upload front side</p>
                                        </div>
                                    )}
                                </div>
                                <input id="modal-front-upload" type="file" accept="image/*,.pdf" onChange={handleFrontFile} className="hidden" />
                                {errors.identity_document_front && <p className="text-red-500 text-xs mt-1">{errors.identity_document_front}</p>}
                            </div>
                            {needsBack && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Document Back <span className="text-gray-400">(image or PDF)</span>
                                    </label>
                                    {isEdit && editingUser.identity_document_back_url && !backPreview && (
                                        <div className="mb-2">
                                            <a href={editingUser.identity_document_back_url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-indigo-600 hover:text-indigo-800 underline">View current document</a>
                                        </div>
                                    )}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById('modal-back-upload').click()}>
                                        {backPreview ? (
                                            <div className="relative">
                                                {data.identity_document_back?.type?.startsWith('image/') ? (
                                                    <img src={backPreview} alt="Back" className="max-h-32 mx-auto rounded" />
                                                ) : (
                                                    <p className="text-sm text-indigo-600">{data.identity_document_back?.name}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">Click to change</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-xs text-gray-400 mt-1">Click to upload back side</p>
                                            </div>
                                        )}
                                    </div>
                                    <input id="modal-back-upload" type="file" accept="image/*,.pdf" onChange={handleBackFile} className="hidden" />
                                    {errors.identity_document_back && <p className="text-red-500 text-xs mt-1">{errors.identity_document_back}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={processing}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm shadow-sm">
                        {processing ? 'Saving...' : (isEdit ? 'Update Staff Member' : 'Create Staff Member')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function Staff({ staff, organizations, filters = {} }) {
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

            <StaffFormModal show={modalOpen} onClose={closeModal} editingUser={editingUser} organizations={organizations} />
        </>
    );
}
