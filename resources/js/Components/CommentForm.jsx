import { useState } from 'react';
import { useLanguage } from '../Context/LanguageContext';

export default function CommentForm({ issueId, parentId = null, onSuccess, onCancel, placeholder }) {
  const { t, lang } = useLanguage();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || body.length > 2000) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
        body: JSON.stringify({ body: body.trim(), parent_id: parentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to submit');
      }

      setBody('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder || (lang === 'np' ? 'आफ्नो टिप्पणी लेख्नुहोस्...' : 'Write your comment...')}
        maxLength={2000}
        rows={3}
        className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-gray-400">
          {body.length}/2000
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
            >
              {lang === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="text-xs px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting
              ? (lang === 'np' ? 'पठाउँदै...' : 'Posting...')
              : (lang === 'np' ? 'पठाउनुहोस्' : 'Post')}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
