import { useState, useEffect } from 'react';
import { useLanguage } from '../Context/LanguageContext';
import CommentForm from './CommentForm';
import { toBsString } from '../utils/bsDate';

function CommentItem({ comment, issueId, depth = 0 }) {
  const { t, lang } = useLanguage();
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  function handleReplyAdded(newReply) {
    setReplies(prev => [...prev, newReply]);
    setShowReply(false);
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-gray-100' : ''}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-[8px] font-bold">
            {comment.author?.charAt(0) || 'A'}
          </div>
          <span className="text-xs font-medium text-gray-700">{comment.author}</span>
          <span className="text-[10px] text-gray-400">
            {lang === 'np' ? comment.bs_date : new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{comment.body}</p>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-[10px] text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {lang === 'np' ? 'जवाफ दिनुहोस्' : 'Reply'}
          </button>
        </div>

        {showReply && (
          <div className="mt-2">
            <CommentForm
              issueId={issueId}
              parentId={comment.id}
              onSuccess={() => setShowReply(false)}
              onCancel={() => setShowReply(false)}
              placeholder={lang === 'np' ? 'जवाफ लेख्नुहोस्...' : 'Write a reply...'}
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

export default function CommentSection({ issueId, comments: initialComments = [] }) {
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState(initialComments);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (initialComments.length === 0) {
      fetch(`/issues/${issueId}/comments`)
        .then(res => res.json())
        .then(data => {
          const list = data.data || data;
          if (Array.isArray(list) && list.length > 0) setComments(list);
        })
        .catch(() => {});
    }
  }, [issueId]);

  function handleCommentAdded() {
    setShowForm(false);
    fetch(`/issues/${issueId}/comments`)
      .then(res => res.json())
      .then(data => {
        if (data.data) setComments(data.data);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-700">
          {lang === 'np' ? 'टिप्पणीहरू' : 'Comments'} ({comments.length})
        </h4>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {lang === 'np' ? 'टिप्पणी थप्नुहोस्' : 'Add Comment'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <CommentForm
            issueId={issueId}
            onSuccess={handleCommentAdded}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">
          {lang === 'np' ? 'कुनै टिप्पणी छैन। पहिलो टिप्पणी थप्नुहोस्।' : 'No comments yet. Be the first to comment.'}
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} issueId={issueId} />
          ))}
        </div>
      )}
    </div>
  );
}
