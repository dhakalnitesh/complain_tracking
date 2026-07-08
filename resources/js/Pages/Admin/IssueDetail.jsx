import { Head, Link } from '@inertiajs/react';
import { StatusBadge, PriorityBadge } from '../../Components/Badge';

export default function IssueDetail({ issue }) {
  return (
    <>
      <Head title={`${issue.reference_code} - Admin`} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={route('admin.dashboard')} className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 inline-block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{issue.reference_code}</h1>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 mb-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Issue Details</h2>
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
              <p className="font-medium text-gray-900">{issue.assigned_user_name || issue.assigned_to || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Reporter</p>
              <p className="font-medium text-gray-900">{issue.reporter_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Submitted</p>
              <p className="font-medium text-gray-900">{new Date(issue.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">SMS Opt-in</p>
              <p className="font-medium text-gray-900">{issue.sms_opt_in ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Anonymous</p>
              <p className="font-medium text-gray-900">{issue.is_anonymous ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {issue.is_sla_breached && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-red-800">SLA Breached — exceeded 48h resolution time</p>
            </div>
          )}

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
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {issue.events.length === 0 && (
              <p className="text-sm text-gray-400">No events yet.</p>
            )}
          </div>
        </div>

        {issue.status === 'resolved' && issue.rating && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800">
              Feedback: {issue.rating}/5
              {issue.feedback_comment && <> &mdash; "{issue.feedback_comment}"</>}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
