import { Head, Link, router } from '@inertiajs/react';
import { StatusBadge, PriorityBadge } from '../../../Components/UI/Badge';
import { useState } from 'react';

const statusOptions = ['received', 'in_progress', 'resolved'];

function getNextStatus(current) {
    const idx = statusOptions.indexOf(current);
    return idx < statusOptions.length - 1 ? statusOptions[idx + 1] : null;
}

export default function IssueDetail({ issue, staff_users = [] }) {
  const [assigning, setAssigning] = useState(false);
  const [reopenModal, setReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  function handleStatusUpdate(newStatus) {
    router.patch(route('admin.issues.update-status', issue.id), { status: newStatus }, { preserveScroll: true });
  }

  function handleReopen() {
    router.patch(route('admin.issues.update-status', issue.id), {
      status: 'received',
      reason: reopenReason,
    }, { preserveScroll: true });
    setReopenModal(false);
    setReopenReason('');
  }

  function handleAssign(staffId, staffName) {
    router.post(route('admin.issues.assign', issue.id), {
      assigned_to: staffName,
      assigned_user_id: staffId || null,
    }, { preserveScroll: true });
    setAssigning(false);
  }

  function orgStaff() {
    return staff_users.filter(s => s.organization_id === issue.organization_id || !s.organization_id);
  }

  return (
    <>
      <Head title={`${issue.reference_code} - Admin`} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href={route('admin.dashboard')} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all">
              Dashboard
            </Link>
            <Link href={route('admin.issues.index')} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
              Issues
            </Link>
            <Link href={route('admin.staff')} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
              Staff
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 ml-2">{issue.reference_code}</h1>
          </div>
          <div className="flex gap-2 items-center">
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
              <p className="font-medium text-gray-900">{issue.bs_created_at}</p>
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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            {issue.status !== 'resolved' ? (
              <>
                <button
                  onClick={() => {
                    const next = getNextStatus(issue.status);
                    if (next) handleStatusUpdate(next);
                  }}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {issue.status === 'received' ? 'Start Progress' : 'Resolve'}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setAssigning(!assigning)}
                    className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {issue.assigned_user_name || issue.assigned_to || 'Assign'}
                  </button>
                  {assigning && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => handleAssign(null, '')}
                        className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                      >
                        Unassign
                      </button>
                      {orgStaff().map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleAssign(s.id, s.name)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                            issue.assigned_user_id === s.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                      {orgStaff().length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">No staff available</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setReopenModal(true)}
                  className="text-sm bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Reopen
                </button>
                <p className="text-xs text-gray-400">Reopening will ask for a reason</p>
              </>
            )}
          </div>

          {issue.is_sla_breached && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-red-800">SLA Breached — exceeded resolution time</p>
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
                  <p className="text-xs text-gray-400 mt-0.5">{event.bs_created_at}</p>
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

      {/* Reopen Reason Modal */}
      {reopenModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reopen Issue</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason for reopening this resolved issue.</p>
            <textarea
              value={reopenReason}
              onChange={e => setReopenReason(e.target.value)}
              placeholder="Reason for reopening..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">This reason will be recorded in the issue timeline.</p>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => { setReopenModal(false); setReopenReason(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReopen}
                disabled={!reopenReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
