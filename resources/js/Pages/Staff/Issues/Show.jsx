import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../../../ziggy';
import { StatusBadge, PriorityBadge } from '../../../Components/UI/Badge';

export default function IssueDetail({ issue }) {
  const { data, setData, post, processing, errors } = useForm({
    comment: '',
    is_public: true,
  });

  function handleSubmit(e) {
    e.preventDefault();
    post(route('staff.issues.comment', issue.id), {
      preserveScroll: true,
      onSuccess: () => setData('comment', ''),
    });
  }

  return (
    <>
      <Head title={`Issue #${issue.reference_code} - Staff`} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={route('dashboard')} className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{issue.reference_code}</h1>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>

        {/* Issue Details Card */}
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

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-3">
            {issue.events.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                    event.is_public ? 'bg-indigo-500' : 'bg-gray-300'
                  }`} />
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-700">{event.description}</p>
                    {!event.is_public && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Internal</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{event.bs_created_at}</p>
                </div>
              </div>
            ))}
            {issue.events.length === 0 && (
              <p className="text-sm text-gray-400">No events yet.</p>
            )}
          </div>
        </div>

        {/* Add Comment Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Add Update</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={data.comment}
                onChange={e => setData('comment', e.target.value)}
                rows={4}
                className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-shadow hover:shadow-sm"
                placeholder="Write a comment or update..."
              />
              {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.is_public}
                onChange={e => setData('is_public', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                {data.is_public ? 'Visible to the public (citizen can see this)' : 'Internal note (only staff can see this)'}
              </span>
            </label>

            <button
              type="submit"
              disabled={processing || !data.comment.trim()}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm active:scale-[0.99]"
            >
              {processing ? 'Posting...' : 'Post Update'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
