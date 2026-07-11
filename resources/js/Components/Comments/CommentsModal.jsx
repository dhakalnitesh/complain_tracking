import { useState, useEffect } from 'react';
import CommentForm from './CommentForm';

function CommentItem({ comment, issueId, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  function handleReplyAdded(data) {
    if (data && data.id) {
      setReplies(prev => [...prev, data]);
    }
    setShowReply(false);
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2 border-gray-100' : ''}`}>
      <div className="py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
            {comment.author?.charAt(0) || 'A'}
          </div>
          <span className="text-xs font-semibold text-gray-800">{comment.author}</span>
          <span className="text-[10px] text-gray-400 ml-auto">{comment.bs_created_at || comment.bs_date}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed ml-8">{comment.body}</p>
        <button
          onClick={() => setShowReply(!showReply)}
          className="text-[11px] text-gray-400 hover:text-indigo-600 font-medium transition-colors mt-1 ml-8"
        >
          Reply
        </button>

        {showReply && (
          <div className="mt-2 ml-8">
            <CommentForm
              issueId={issueId}
              parentId={comment.id}
              onSuccess={handleReplyAdded}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-1">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} issueId={issueId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsModal({ open, issueId, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !issueId) return;
    setLoading(true);
    fetch(`/issues/${issueId}/comments`, { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then(data => {
        const list = data.data || data;
        if (Array.isArray(list)) setComments(list);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [open, issueId]);

  function handleCommentAdded(data) {
    if (data && data.id) {
      setComments(prev => [data, ...prev]);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'cm-fadeIn 150ms ease-out' }} />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 w-full sm:max-w-lg max-h-[85vh] flex flex-col"
        style={{ animation: 'cm-slideUp 200ms ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-t-2xl sm:rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comments ({comments.length})
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-10 h-10 mx-auto text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-400 mt-1">No comments yet.</p>
              <p className="text-xs text-gray-300">Be the first to comment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} issueId={issueId} />
              ))}
            </div>
          )}
        </div>

        {/* Comment form */}
        <div className="border-t border-gray-100 px-5 py-3.5 bg-gray-50/50">
          <CommentForm issueId={issueId} onSuccess={handleCommentAdded} />
        </div>
      </div>

      <style>{`
        @keyframes cm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cm-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
