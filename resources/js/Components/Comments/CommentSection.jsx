import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import CommentForm from './CommentForm';

function CommentItem({ comment, issueId, depth = 0 }) {
  const { lang } = useLanguage();
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  function handleReplyAdded(data) {
    if (data && data.id) {
      setReplies(prev => [...prev, data]);
    }
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
          <span className="text-[10px] text-gray-400">{comment.bs_created_at || comment.bs_date}</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{comment.body}</p>

        <button
          onClick={() => setShowReply(!showReply)}
          className="text-[10px] text-gray-400 hover:text-indigo-600 transition-colors mt-1"
        >
          {lang === 'np' ? 'जवाफ दिनुहोस्' : 'Reply'}
        </button>

        {showReply && (
          <div className="mt-2">
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

export default function CommentSection({ issueId }) {
  const { t, lang } = useLanguage();
  const [comments, setComments] = useState([]);
  const pollRef = useRef(null);

  function fetchComments() {
    fetch(`/issues/${issueId}/comments`, { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then(data => {
        const list = data.data || data;
        if (Array.isArray(list)) setComments(list);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchComments();
    pollRef.current = setInterval(fetchComments, 15000);
    return () => clearInterval(pollRef.current);
  }, [issueId]);

  function handleCommentAdded(data) {
    if (data && data.id) {
      setComments(prev => [data, ...prev]);
    } else {
      fetchComments();
    }
  }

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">
        {lang === 'np' ? 'टिप्पणीहरू' : 'Comments'} ({comments.length})
      </h4>

      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <CommentForm issueId={issueId} onSuccess={handleCommentAdded} />
      </div>

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
