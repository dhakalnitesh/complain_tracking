import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import SearchSelect from '../../../Components/UI/SearchSelect';
import { useState } from 'react';

export default function ExtensionRequests({ extension_requests, filters = {} }) {
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [reviewingId, setReviewingId] = useState(null);
    const [action, setAction] = useState('approved');
    const [adminNote, setAdminNote] = useState('');

    function applyFilters() {
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        router.get(route('admin.extension-requests'), params, { preserveState: true, replace: true });
    }

    function handleReview(id) {
        router.post(route('admin.extension-requests.review', id), {
            action,
            admin_note: adminNote,
        }, {
            preserveScroll: true,
            onSuccess: () => { setReviewingId(null); setAdminNote(''); },
        });
    }

    return (
        <>
            <Head title="Extension Requests" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.dashboard')} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all">
                            Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 ml-2">Extension Requests</h1>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-40">
                            <SearchSelect
                                options={[
                                    { value: 'all', label: 'All Status' },
                                    { value: 'pending', label: 'Pending' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'rejected', label: 'Rejected' },
                                ]}
                                value={statusFilter}
                                onChange={v => { setStatusFilter(v); setTimeout(applyFilters, 0); }}
                                placeholder="Status"
                            />
                        </div>
                        <button onClick={applyFilters} className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                            Apply
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {extension_requests.data.map(er => (
                        <div key={er.id} className="bg-white rounded-xl border border-gray-200/60 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-bold text-indigo-600">{er.issue_reference}</span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                            er.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            er.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {er.status.charAt(0).toUpperCase() + er.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">{er.issue_title}</p>
                                    <p className="text-xs text-gray-500 mb-2">Requested by: {er.user_name}</p>
                                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Reason:</p>
                                        <p className="text-sm text-gray-700">{er.reason}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {er.original_deadline && (
                                            <span>Original: {new Date(er.original_deadline).toLocaleDateString('en-GB')}</span>
                                        )}
                                        <span>Requested: {new Date(er.requested_deadline).toLocaleDateString('en-GB')}</span>
                                    </div>
                                    {er.admin_note && (
                                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                                            <span className="font-medium">Admin note:</span> {er.admin_note}
                                        </div>
                                    )}
                                </div>
                                {er.status === 'pending' && (
                                    <div className="shrink-0">
                                        {reviewingId === er.id ? (
                                            <div className="w-64 space-y-2">
                                                <select
                                                    value={action}
                                                    onChange={e => setAction(e.target.value)}
                                                    className="w-full text-xs rounded-lg border-gray-200 border px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="approved">Approve</option>
                                                    <option value="rejected">Reject</option>
                                                </select>
                                                <textarea
                                                    value={adminNote}
                                                    onChange={e => setAdminNote(e.target.value)}
                                                    placeholder="Admin note (optional)..."
                                                    rows={2}
                                                    className="w-full text-xs rounded-lg border-gray-200 border px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleReview(er.id)}
                                                        className={`flex-1 py-1.5 text-xs font-medium text-white rounded-lg ${
                                                            action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                                        } transition-colors`}>
                                                        {action === 'approved' ? 'Approve' : 'Reject'}
                                                    </button>
                                                    <button onClick={() => { setReviewingId(null); setAdminNote(''); }}
                                                        className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setReviewingId(er.id)}
                                                className="px-4 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
                                                Review
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {extension_requests.data.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-sm">No extension requests found.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2 mt-6">
                    {extension_requests.links?.map((link, i) => (
                        <button key={i}
                            onClick={() => { if (link.url && !link.active) { router.get(link.url, {}, { preserveState: true, replace: true }); } }}
                            disabled={!link.url}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                link.active ? 'bg-indigo-600 text-white' : link.url ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label.replace(/</g, '&lt;').replace(/>/g, '&gt;') }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
