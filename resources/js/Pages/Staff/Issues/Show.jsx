import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { StatusBadge, PriorityBadge } from '../../../Components/UI/Badge';
import { useState } from 'react';

export default function IssueDetail({ issue }) {
    const user = usePage().props.auth.user;
    const { data, setData, post, processing, errors } = useForm({
        comment: '',
        is_public: true,
    });

    // Progress
    const [progressNotes, setProgressNotes] = useState('');
    const [progressPhotos, setProgressPhotos] = useState([]);
    const [progressPreview, setProgressPreview] = useState([]);
    const [progressSubmitting, setProgressSubmitting] = useState(false);

    // Extension
    const [extensionReason, setExtensionReason] = useState('');
    const [extensionDays, setExtensionDays] = useState('');
    const [extensionSubmitting, setExtensionSubmitting] = useState(false);
    const [showExtensionForm, setShowExtensionForm] = useState(false);

    // Resolve
    const [showResolveForm, setShowResolveForm] = useState(false);
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [proofPhotos, setProofPhotos] = useState([]);
    const [proofPreview, setProofPreview] = useState([]);
    const [resolveSubmitting, setResolveSubmitting] = useState(false);

    const deadline = issue.extension_deadline_at || issue.deadline_at;
    const deadlineDate = deadline ? new Date(deadline) : null;
    const now = new Date();
    const isOverdue = deadlineDate && deadlineDate < now && issue.status !== 'resolved';

    function daysRemaining() {
        if (!deadlineDate) return null;
        const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        return diff;
    }

    function handleCommentSubmit(e) {
        e.preventDefault();
        post(route('staff.issues.comment', issue.id), {
            preserveScroll: true,
            onSuccess: () => setData('comment', ''),
        });
    }

    function handlePhotoChange(e, type) {
        const files = Array.from(e.target.files);
        if (type === 'progress') {
            setProgressPhotos(files);
            setProgressPreview(files.map(f => URL.createObjectURL(f)));
        } else {
            setProofPhotos(files);
            setProofPreview(files.map(f => URL.createObjectURL(f)));
        }
    }

    function removePhoto(idx, type) {
        if (type === 'progress') {
            setProgressPhotos(prev => prev.filter((_, j) => j !== idx));
            setProgressPreview(prev => prev.filter((_, j) => j !== idx));
        } else {
            setProofPhotos(prev => prev.filter((_, j) => j !== idx));
            setProofPreview(prev => prev.filter((_, j) => j !== idx));
        }
    }

    async function handleProgressSubmit(e) {
        e.preventDefault();
        if (!progressNotes.trim()) return;
        setProgressSubmitting(true);
        try {
            const form = new FormData();
            form.append('notes', progressNotes);
            progressPhotos.forEach(p => form.append('photos[]', p));
            await router.post(route('staff.issues.progress', issue.id), form, {
                preserveScroll: true,
                onSuccess: () => {
                    setProgressNotes('');
                    setProgressPhotos([]);
                    setProgressPreview([]);
                },
            });
        } finally {
            setProgressSubmitting(false);
        }
    }

    function handleExtensionSubmit(e) {
        e.preventDefault();
        if (!extensionReason.trim() || !extensionDays) return;
        setExtensionSubmitting(true);
        router.post(route('staff.issues.extension', issue.id), {
            reason: extensionReason,
            requested_days: extensionDays,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setExtensionReason('');
                setExtensionDays('');
                setShowExtensionForm(false);
            },
            onFinish: () => setExtensionSubmitting(false),
        });
    }

    async function handleResolve(e) {
        e.preventDefault();
        if (!resolutionSummary.trim()) return;
        setResolveSubmitting(true);
        try {
            const form = new FormData();
            form.append('resolution_summary', resolutionSummary);
            proofPhotos.forEach(p => form.append('proof_photos[]', p));
            await router.post(route('staff.issues.resolve', issue.id), form, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowResolveForm(false);
                    setResolutionSummary('');
                    setProofPhotos([]);
                    setProofPreview([]);
                },
            });
        } finally {
            setResolveSubmitting(false);
        }
    }

    const remaining = daysRemaining();

    return (
        <>
            <Head title={`Issue #${issue.reference_code} - Staff`} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                {/* Nav */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href={route('staff.issues.index')} className="text-sm text-indigo-600 hover:text-indigo-800">
                        &larr; My Issues
                    </Link>
                    <span className="text-gray-300">|</span>
                    {user?.organization && (
                        <>
                            <Link href={route('org.dashboard', user.organization.slug)} className="text-sm text-indigo-600 hover:text-indigo-800">
                                {user.organization.name}
                            </Link>
                            <span className="text-gray-300">|</span>
                        </>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{issue.reference_code}</h1>
                    <div className="flex gap-2 ml-auto">
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                    </div>
                </div>

                {/* Deadline Banner */}
                {deadline && issue.status !== 'resolved' && (
                    <div className={`rounded-xl border p-4 mb-5 ${
                        isOverdue ? 'bg-red-50 border-red-200' : remaining !== null && remaining <= 2 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{isOverdue ? 'Overdue' : remaining !== null && remaining <= 2 ? 'Deadline approaching' : 'Deadline'}</p>
                                <p className="text-xs text-gray-600">{deadlineDate?.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                    {isOverdue ? 'Overdue' : `${remaining} days left`}
                                </p>
                                {issue.extension_deadline_at && <p className="text-xs text-amber-600">Extended deadline</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Issue Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 mb-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Organization</p>
                            <p className="font-medium text-gray-900">{issue.organization}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Category</p>
                            <p className="font-medium text-gray-900">{issue.category}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Location</p>
                            <p className="font-medium text-gray-900">{issue.location}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Assigned To</p>
                            <p className="font-medium text-gray-900">{issue.assigned_to || 'Unassigned'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Reporter</p>
                            <p className="font-medium text-gray-900">{issue.reporter_name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase">Submitted</p>
                            <p className="font-medium text-gray-900">{issue.bs_created_at}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-gray-400 uppercase mb-1">Description</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.description}</p>
                    </div>

                    {issue.photo_path && (
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Photo</p>
                            <img src={issue.photo_path} alt="Issue" className="max-w-md rounded-xl border border-gray-200" />
                        </div>
                    )}
                </div>

                {/* Resolution Summary (if resolved) */}
                {issue.status === 'resolved' && issue.resolution_summary && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 sm:p-7 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-sm font-bold text-green-800">Resolution Summary</h2>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-green-100">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.resolution_summary}</p>
                        </div>
                        {issue.resolved_at && (
                            <p className="text-xs text-gray-500 mt-2">Resolved on {new Date(issue.resolved_at).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        )}
                    </div>
                )}

                {/* Resolve Button (if not resolved) */}
                {issue.status !== 'resolved' && (
                    <div className="mb-5">
                        {!showResolveForm ? (
                            <button onClick={() => setShowResolveForm(true)}
                                className="w-full py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm">
                                <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Mark as Resolved
                            </button>
                        ) : (
                            <form onSubmit={handleResolve} className="bg-green-50 border border-green-200 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-green-800 mb-3">Resolution Details</h3>
                                <p className="text-xs text-gray-500 mb-3">Describe what was done, how it was solved, and the outcome. This will be visible to the citizen.</p>
                                <textarea
                                    value={resolutionSummary}
                                    onChange={e => setResolutionSummary(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-xl border-green-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none mb-3"
                                    placeholder="Describe the resolution in detail. What was the problem? How was it fixed? What is the final result?"
                                />
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 cursor-pointer">
                                        <span className="inline-flex items-center gap-1 text-green-700 hover:text-green-900">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Add proof photos
                                        </span>
                                        <input type="file" multiple accept="image/*" onChange={e => handlePhotoChange(e, 'proof')} className="hidden" />
                                    </label>
                                    {proofPreview.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {proofPreview.map((url, i) => (
                                                <div key={i} className="relative">
                                                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-green-200" />
                                                    <button type="button" onClick={() => removePhoto(i, 'proof')}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={resolveSubmitting || !resolutionSummary.trim()}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                                        {resolveSubmitting ? 'Submitting...' : 'Confirm Resolution'}
                                    </button>
                                    <button type="button" onClick={() => { setShowResolveForm(false); setResolutionSummary(''); setProofPhotos([]); setProofPreview([]); }}
                                        className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Daily Progress */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 mb-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Progress</h2>

                    {issue.status !== 'resolved' && (
                        <form onSubmit={handleProgressSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="text-xs font-medium text-gray-700 mb-3">Add Today's Progress</h3>
                            <textarea value={progressNotes} onChange={e => setProgressNotes(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border-gray-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none mb-3"
                                placeholder="Describe what you did today..." />
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1 cursor-pointer">
                                    <span className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Upload photos
                                    </span>
                                    <input type="file" multiple accept="image/*" onChange={e => handlePhotoChange(e, 'progress')} className="hidden" />
                                </label>
                                {progressPreview.length > 0 && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {progressPreview.map((url, i) => (
                                            <div key={i} className="relative">
                                                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                                <button type="button" onClick={() => removePhoto(i, 'progress')}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={progressSubmitting || !progressNotes.trim()}
                                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                {progressSubmitting ? 'Saving...' : 'Save Progress'}
                            </button>
                        </form>
                    )}

                    {issue.daily_progress.length > 0 ? (
                        <div className="space-y-3">
                            {issue.daily_progress.map(p => (
                                <div key={p.id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-gray-500">{p.user_name}</p>
                                        <p className="text-xs text-gray-400">{p.bs_created_at}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.notes}</p>
                                    {p.photos && p.photos.length > 0 && (
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            {p.photos.map((photo, i) => (
                                                <img key={i} src={photo ? `/storage/${photo}` : null} alt="Progress photo"
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                                                    onClick={() => window.open(`/storage/${photo}`, '_blank')}
                                                    onError={e => { e.target.style.display = 'none'; }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No progress updates yet.</p>
                    )}
                </div>

                {/* Extension Request */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 mb-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900">Extension Requests</h2>
                        {issue.status !== 'resolved' && !showExtensionForm && (
                            <button onClick={() => setShowExtensionForm(true)}
                                className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                                Request Extension
                            </button>
                        )}
                    </div>

                    {showExtensionForm && (
                        <form onSubmit={handleExtensionSubmit} className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <h3 className="text-xs font-medium text-amber-700 mb-3">Why do you need more time?</h3>
                            <textarea value={extensionReason} onChange={e => setExtensionReason(e.target.value)} rows={3}
                                className="w-full rounded-lg border-amber-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none mb-3"
                                placeholder="Explain why you need an extension..." />
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Additional days needed</label>
                                <input type="number" min="1" max="365" value={extensionDays} onChange={e => setExtensionDays(e.target.value)}
                                    placeholder="e.g. 7" className="w-32 rounded-lg border-amber-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={extensionSubmitting || !extensionReason.trim() || !extensionDays}
                                    className="px-4 py-2 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
                                    {extensionSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button type="button" onClick={() => setShowExtensionForm(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                            </div>
                        </form>
                    )}

                    {issue.extension_requests.length > 0 ? (
                        <div className="space-y-3">
                            {issue.extension_requests.map(er => (
                                <div key={er.id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                er.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                er.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>{er.status.charAt(0).toUpperCase() + er.status.slice(1)}</span>
                                            <p className="text-xs text-gray-500">{er.user_name}</p>
                                        </div>
                                        <p className="text-xs text-gray-400">{er.bs_created_at}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-1">{er.reason}</p>
                                    <p className="text-xs text-gray-500">Requested until: {new Date(er.requested_deadline).toLocaleDateString('en-GB')}</p>
                                    {er.admin_note && (
                                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2"><span className="font-medium">Admin:</span> {er.admin_note}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">No extension requests.</p>
                    )}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 mb-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h2>
                    <div className="space-y-3">
                        {issue.events.map((event) => (
                            <div key={event.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${event.is_public ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                                    <div className="w-px flex-1 bg-gray-200 mt-1" />
                                </div>
                                <div className="flex-1 pb-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-700">{event.description}</p>
                                        {!event.is_public && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Internal</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{event.bs_created_at}</p>
                                </div>
                            </div>
                        ))}
                        {issue.events.length === 0 && <p className="text-sm text-gray-400">No events yet.</p>}
                    </div>
                </div>

                {/* Comment Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Add Update</h2>
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                        <div>
                            <textarea value={data.comment} onChange={e => setData('comment', e.target.value)} rows={4}
                                className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-shadow hover:shadow-sm"
                                placeholder="Write a comment or update..." />
                            {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment}</p>}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.is_public} onChange={e => setData('is_public', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                            <span className="text-sm text-gray-700">
                                {data.is_public ? 'Visible to the public (citizen can see this)' : 'Internal note (only staff can see this)'}
                            </span>
                        </label>
                        <button type="submit" disabled={processing || !data.comment.trim()}
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm active:scale-[0.99]">
                            {processing ? 'Posting...' : 'Post Update'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
