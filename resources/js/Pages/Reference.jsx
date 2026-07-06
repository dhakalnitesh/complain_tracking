import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../ziggy';
import { StatusBadge, PriorityBadge } from '../Components/Badge';

export default function Reference({ issue }) {
    const { data, setData, post, processing, errors } = useForm({
        rating: 0,
        feedback_comment: '',
    });

    function handleFeedback(e) {
        e.preventDefault();
        post(route('issues.feedback', issue.id), {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Issue Submitted" />

            <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
                <div className="max-w-lg w-full">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Issue Submitted Successfully!</h1>
                        <p className="text-gray-500 mb-6">
                            Your issue has been recorded. Save this reference code to track its progress:
                        </p>

                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-6 border border-indigo-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Reference Code</p>
                            <p className="text-3xl font-bold text-indigo-600 tracking-widest font-mono">{issue.reference_code}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm text-left">
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
                        </div>

                        <div className="flex gap-3">
                            <Link href={route('dashboard')} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm">
                                Dashboard
                            </Link>
                            <Link href={route('status.check')} className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition-all text-sm">
                                Track Status
                            </Link>
                        </div>
                    </div>

                    {/* Issue Timeline */}
                    {issue.events && issue.events.length > 0 && (
                        <div className="mt-6 bg-white rounded-xl border border-gray-200/60 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Issue Timeline</h3>
                            <div className="space-y-3">
                                {issue.events.map((event, idx) => (
                                    <div key={event.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                                                idx === 0 ? 'bg-indigo-500' : 'bg-gray-300'
                                            }`} />
                                            {idx < issue.events.length - 1 && (
                                                <div className="w-px flex-1 bg-gray-200" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-700">{event.description}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(event.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feedback Form */}
                    {issue.status === 'resolved' && !issue.rating && (
                        <div className="mt-6 bg-white rounded-xl border border-gray-200/60 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Rate Your Experience</h3>
                            <form onSubmit={handleFeedback} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setData('rating', star)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                                    data.rating >= star
                                                        ? 'bg-amber-100 text-amber-600 scale-110'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-amber-50'
                                                }`}
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
                                    <textarea
                                        value={data.feedback_comment}
                                        onChange={e => setData('feedback_comment', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                        placeholder="Share your thoughts about how the issue was handled..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing || !data.rating}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                                >
                                    {processing ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </form>
                        </div>
                    )}

                    {issue.rating && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                            <p className="text-sm font-medium text-green-800">
                                Thank you! You rated this {issue.rating}/5
                                {issue.feedback_comment && <> &mdash; "{issue.feedback_comment}"</>}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
