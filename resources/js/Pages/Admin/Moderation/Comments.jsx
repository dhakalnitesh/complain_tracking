import { Head, Link, usePage, router } from '@inertiajs/react';

export default function CommentsModeration() {
  const { comments } = usePage().props;

  function approve(id) {
    router.post(route('admin.moderation.comments.approve', id));
  }

  function hide(id) {
    router.post(route('admin.moderation.comments.hide', id));
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <Head title="Comment Moderation" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comment Moderation</h1>
        <Link href={route('admin.moderation')} className="text-indigo-600 hover:underline text-sm">Back to Flags</Link>
      </div>

      {comments.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No pending comments</p>
          <p className="text-sm mt-1">All comments have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.data.map(comment => (
            <div key={comment.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{comment.user?.name ?? 'Anonymous'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    on <Link href={route('admin.issues.show', comment.issue_id)} className="text-indigo-600 hover:underline">Issue #{comment.issue_id}</Link>
                    {' · '}{comment.created_at}
                  </p>
                  <p className="mt-3 text-gray-700">{comment.body}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => approve(comment.id)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">Approve</button>
                  <button onClick={() => hide(comment.id)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Hide</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.links && (
        <div className="mt-6 flex justify-center gap-2" dangerouslySetInnerHTML={{ __html: comments.links }} />
      )}
    </div>
  );
}
