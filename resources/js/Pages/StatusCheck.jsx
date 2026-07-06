import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../ziggy';
import { StatusBadge, PriorityBadge } from '../Components/Badge';

export default function StatusCheck({ issue, error }) {
    const { data, setData, get, processing } = useForm({
        code: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        get(route('status.check'), { preserveState: true });
    }

    return (
        <>
            <Head title="Track Issue Status" />

            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Track Your Issue</h1>
                        <p className="text-gray-500 text-sm mt-1">Enter your reference code to see the current status.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Code</label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value.toUpperCase())}
                                placeholder="e.g. GRV-0001"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase tracking-wider font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={processing || !data.code}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {processing ? 'Searching...' : 'Look Up'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {issue && (
                        <div className="mt-6 space-y-3">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Reference</span>
                                    <span className="font-mono font-bold text-gray-900">{issue.reference_code}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Organization</span>
                                    <span className="font-medium text-gray-900">{issue.organization}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Category</span>
                                    <span className="font-medium text-gray-900">{issue.category}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Location</span>
                                    <span className="font-medium text-gray-900">{issue.location}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Priority</span>
                                    <PriorityBadge priority={issue.priority} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <StatusBadge status={issue.status} />
                                </div>
                                {issue.assigned_to && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Assigned to</span>
                                        <span className="font-medium text-gray-900">{issue.assigned_to}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-gray-200">
                                    <p className="text-gray-500 mb-1">Description:</p>
                                    <p className="text-gray-900">{issue.description}</p>
                                </div>
                                {issue.photo_path && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-gray-500 mb-1">Attachment:</p>
                                        <img src={issue.photo_path} alt="Issue photo" className="rounded-lg max-h-48 object-cover" />
                                    </div>
                                )}
                                {issue.status === 'resolved' && issue.resolved_at && (
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                        <span className="text-gray-500">Resolved on</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(issue.resolved_at).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {issue.status === 'resolved' && !issue.rating && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                    <p className="text-sm font-medium text-indigo-900 mb-2">How was your experience?</p>
                                    <Link
                                        href={route('issues.show-reference', issue.reference_code)}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Leave feedback &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
